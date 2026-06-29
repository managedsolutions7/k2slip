"use server";

import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Entry } from "@/models/Entry";
import { Company } from "@/models/Company";
import { computeAll } from "@/lib/calc";

export interface ImportResult {
  imported: number;
  failed: { row: number; error: string }[];
  total: number;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() && !l.trim().startsWith("#"));
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/\s+/g, "_")
  );
  const rows = lines.slice(1).map((l) => parseCSVLine(l));
  return { headers, rows };
}

function toNum(val: string): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

const REQUIRED_HEADERS = [
  "date",
  "company_name",
  "printed_slip_no",
  "driver_name",
  "vehicle_type",
  "material",
  "gross_weight_kg",
  "tare_weight_kg",
];

export async function importEntriesFromCSV(csvText: string): Promise<ImportResult> {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return { imported: 0, failed: [{ row: 0, error: "Unauthorized" }], total: 0 };
  }

  await connectDB();

  const { headers, rows } = parseCSV(csvText);

  const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    return {
      imported: 0,
      failed: [{ row: 0, error: `Missing required columns: ${missing.join(", ")}` }],
      total: 0,
    };
  }

  const idx = (name: string) => headers.indexOf(name);

  const companies = await Company.find({}).lean();
  const companyMap = new Map<string, string>();
  companies.forEach((c) => companyMap.set(c.name.toLowerCase().trim(), c._id.toString()));

  let imported = 0;
  const failed: { row: number; error: string }[] = [];
  const dataRows = rows.filter((r) => r.some((v) => v));

  for (let i = 0; i < dataRows.length; i++) {
    const rowNum = i + 2;
    const row = dataRows[i];
    const get = (name: string) => (row[idx(name)] ?? "").trim();

    const dateStr = get("date");
    const companyName = get("company_name");
    const printedSlipNo = get("printed_slip_no");
    const driverName = get("driver_name");
    const driverContact = get("driver_contact");
    const vehicleType = get("vehicle_type");
    const material = get("material");
    const grossWeight = toNum(get("gross_weight_kg"));
    const tareWeight = toNum(get("tare_weight_kg"));
    const dustWeightVal = toNum(get("dust_weight_kg"));
    const moistureWeightVal = toNum(get("moisture_weight_kg"));
    const dustExcluded = get("dust_excluded").toLowerCase() === "true";
    const moistureExcluded = get("moisture_excluded").toLowerCase() === "true";

    if (!dateStr) { failed.push({ row: rowNum, error: "date is required" }); continue; }
    if (!companyName) { failed.push({ row: rowNum, error: "company_name is required" }); continue; }
    if (!printedSlipNo) { failed.push({ row: rowNum, error: "printed_slip_no is required" }); continue; }
    if (!driverName) { failed.push({ row: rowNum, error: "driver_name is required" }); continue; }
    if (!vehicleType) { failed.push({ row: rowNum, error: "vehicle_type is required" }); continue; }
    if (!material) { failed.push({ row: rowNum, error: "material is required" }); continue; }
    if (grossWeight == null) { failed.push({ row: rowNum, error: "gross_weight_kg is required" }); continue; }
    if (tareWeight == null) { failed.push({ row: rowNum, error: "tare_weight_kg is required" }); continue; }
    if (grossWeight <= tareWeight) {
      failed.push({ row: rowNum, error: "gross_weight_kg must be greater than tare_weight_kg" });
      continue;
    }

    const companyId = companyMap.get(companyName.toLowerCase());
    if (!companyId) {
      failed.push({ row: rowNum, error: `Company "${companyName}" not found — add it in Admin → Companies first` });
      continue;
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      failed.push({ row: rowNum, error: `Invalid date "${dateStr}" — use YYYY-MM-DD format` });
      continue;
    }

    const calc = computeAll({
      grossWeight,
      tareWeight,
      dustWeight: dustWeightVal,
      moistureWeight: moistureWeightVal,
      dustExcluded,
      moistureExcluded,
    });

    try {
      await Entry.create({
        company: companyId,
        printedSlipNo,
        date,
        driverName,
        driverContact,
        vehicleType,
        material,
        grossWeight,
        tareWeight,
        netWeight: calc.netWeight,
        dustWeight: calc.dustWeight,
        dustPercent: calc.dustPercent,
        dustExcluded: calc.dustExcluded,
        moistureWeight: calc.moistureWeight,
        moisturePercent: calc.moisturePercent,
        moistureExcluded: calc.moistureExcluded,
        deduction: calc.deduction,
        finalWeight: calc.finalWeight,
        operator: session.user.id,
      });
      imported++;
    } catch (err) {
      failed.push({
        row: rowNum,
        error: `DB error: ${err instanceof Error ? err.message : "Unknown error"}`,
      });
    }
  }

  return { imported, failed, total: dataRows.length };
}
