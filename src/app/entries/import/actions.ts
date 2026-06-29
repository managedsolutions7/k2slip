"use server";

import { connectDB } from "@/lib/db";
import { Entry } from "@/models/Entry";
import { auth } from "@/lib/auth";
import { computeAll } from "@/lib/calc";

export interface ImportRow {
  company: string;
  printedSlipNo: string;
  date: string;
  vendorName: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  vehicleType: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  dustWeight: number | null;
  moistureWeight: number | null;
  dustExcluded: boolean;
  moistureExcluded: boolean;
}

const BATCH_SIZE = 50;

export async function importEntries(rows: ImportRow[]) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  let imported = 0;
  const failed: { row: number; error: string }[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    const docs = [];
    for (let j = 0; j < batch.length; j++) {
      const data = batch[j];
      const rowNum = i + j + 1;

      try {
        const calc = computeAll({
          grossWeight: data.grossWeight,
          tareWeight: data.tareWeight,
          dustWeight: data.dustWeight,
          moistureWeight: data.moistureWeight,
          dustExcluded: data.dustExcluded,
          moistureExcluded: data.moistureExcluded,
        });

        docs.push({
          company: data.company,
          printedSlipNo: data.printedSlipNo,
          date: new Date(data.date),
          vendorName: data.vendorName || "",
          vehicleNumber: data.vehicleNumber || "",
          driverName: data.driverName || "",
          driverContact: data.driverContact || "",
          vehicleType: data.vehicleType || "Unknown",
          material: data.material || "Unknown",
          grossWeight: data.grossWeight,
          tareWeight: data.tareWeight,
          netWeight: calc.netWeight,
          dustWeight: calc.dustWeight,
          dustPercent: calc.dustPercent,
          moistureWeight: calc.moistureWeight,
          moisturePercent: calc.moisturePercent,
          dustExcluded: calc.dustExcluded,
          moistureExcluded: calc.moistureExcluded,
          deduction: calc.deduction,
          finalWeight: calc.finalWeight,
          operator: session.user.id,
        });
      } catch {
        failed.push({ row: rowNum, error: "Calculation error" });
      }
    }

    for (const doc of docs) {
      try {
        await Entry.create(doc);
        imported++;
      } catch (err) {
        const idx = docs.indexOf(doc);
        failed.push({
          row: i + idx + 1,
          error: err instanceof Error ? err.message : "Database error",
        });
      }
    }
  }

  return { imported, failed };
}
