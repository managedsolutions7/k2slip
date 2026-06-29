"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { computeAll } from "@/lib/calc";
import { importEntries, type ImportRow } from "./actions";

interface Company {
  _id: string;
  name: string;
}

interface ParsedRow {
  rowNum: number;
  data: ImportRow | null;
  error: string | null;
  preview: {
    company: string;
    printedSlipNo: string;
    date: string;
    vendorName: string;
    vehicleNumber: string;
    grossWeight: number;
    tareWeight: number;
    netWeight: number;
    finalWeight: number;
  } | null;
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    return fields;
  });
}

const EXPECTED_HEADERS = [
  "company", "printedSlipNo", "date", "vendorName", "vehicleNumber",
  "driverName", "driverContact", "vehicleType", "material",
  "grossWeight", "tareWeight", "dustWeight", "moistureWeight",
  "dustExcluded", "moistureExcluded",
];

export default function ImportClient() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [headerError, setHeaderError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: { row: number; error: string }[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(() => setError("Failed to load companies"));
  }, []);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeaderError("");
    setParsed([]);
    setResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setHeaderError("CSV must have a header row and at least one data row.");
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase().trim());
      const missing = EXPECTED_HEADERS.filter(
        (h) => !headers.includes(h.toLowerCase())
      );
      if (missing.length > 0) {
        setHeaderError(`Missing columns: ${missing.join(", ")}`);
        return;
      }

      const colIndex = (name: string) =>
        headers.indexOf(name.toLowerCase());

      const companyMap = new Map(
        companies.map((c) => [c.name.toLowerCase(), c._id])
      );

      const parsed: ParsedRow[] = [];
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i];
        if (cols.length < EXPECTED_HEADERS.length) {
          parsed.push({ rowNum: i + 1, data: null, error: "Too few columns", preview: null });
          continue;
        }

        const companyName = cols[colIndex("company")];
        const companyId = companyMap.get(companyName.toLowerCase());
        if (!companyId) {
          parsed.push({ rowNum: i + 1, data: null, error: `Unknown company: "${companyName}"`, preview: null });
          continue;
        }

        const slipNo = cols[colIndex("printedSlipNo")];
        if (!slipNo) {
          parsed.push({ rowNum: i + 1, data: null, error: "Missing printedSlipNo", preview: null });
          continue;
        }

        const dateStr = cols[colIndex("date")];
        if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          parsed.push({ rowNum: i + 1, data: null, error: `Invalid date: "${dateStr}"`, preview: null });
          continue;
        }

        const gross = parseFloat(cols[colIndex("grossWeight")]);
        const tare = parseFloat(cols[colIndex("tareWeight")]);
        if (isNaN(gross) || isNaN(tare)) {
          parsed.push({ rowNum: i + 1, data: null, error: "Gross/tare weight must be numbers", preview: null });
          continue;
        }
        if (gross <= tare) {
          parsed.push({ rowNum: i + 1, data: null, error: "Gross must be greater than tare", preview: null });
          continue;
        }

        const dustW = cols[colIndex("dustWeight")] ? parseFloat(cols[colIndex("dustWeight")]) : null;
        const moistureW = cols[colIndex("moistureWeight")] ? parseFloat(cols[colIndex("moistureWeight")]) : null;
        const dustExcluded = cols[colIndex("dustExcluded")]?.toLowerCase() === "true";
        const moistureExcluded = cols[colIndex("moistureExcluded")]?.toLowerCase() === "true";

        if (dustW != null && isNaN(dustW)) {
          parsed.push({ rowNum: i + 1, data: null, error: "Invalid dustWeight", preview: null });
          continue;
        }
        if (moistureW != null && isNaN(moistureW)) {
          parsed.push({ rowNum: i + 1, data: null, error: "Invalid moistureWeight", preview: null });
          continue;
        }

        const calc = computeAll({
          grossWeight: gross,
          tareWeight: tare,
          dustWeight: dustW,
          moistureWeight: moistureW,
          dustExcluded,
          moistureExcluded,
        });

        const row: ImportRow = {
          company: companyId,
          printedSlipNo: slipNo,
          date: dateStr,
          vendorName: cols[colIndex("vendorName")] || "",
          vehicleNumber: cols[colIndex("vehicleNumber")] || "",
          driverName: cols[colIndex("driverName")] || "",
          driverContact: cols[colIndex("driverContact")] || "",
          vehicleType: cols[colIndex("vehicleType")] || "",
          material: cols[colIndex("material")] || "",
          grossWeight: gross,
          tareWeight: tare,
          dustWeight: dustW,
          moistureWeight: moistureW,
          dustExcluded,
          moistureExcluded,
        };

        parsed.push({
          rowNum: i + 1,
          data: row,
          error: null,
          preview: {
            company: companyName,
            printedSlipNo: slipNo,
            date: dateStr,
            vendorName: row.vendorName,
            vehicleNumber: row.vehicleNumber,
            grossWeight: gross,
            tareWeight: tare,
            netWeight: calc.netWeight,
            finalWeight: calc.finalWeight,
          },
        });
      }

      setParsed(parsed);
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    const valid = parsed.filter((r) => r.data != null);
    if (valid.length === 0) return;

    setImporting(true);
    setError("");

    const res = await importEntries(valid.map((r) => r.data!));
    setImporting(false);

    if ("error" in res) {
      setError(res.error as string);
    } else {
      setResult(res);
    }
  }

  const validCount = parsed.filter((r) => r.data != null).length;
  const errorCount = parsed.filter((r) => r.error != null).length;

  if (result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="rounded-lg border bg-white p-8 text-center shadow">
          <div className="mb-4 text-4xl text-green-500">&#10003;</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Import Complete</h2>
          <p className="mb-2 text-sm text-gray-600">
            {result.imported} entries imported successfully.
          </p>
          {result.failed.length > 0 && (
            <div className="mx-auto mt-4 max-w-md text-left">
              <p className="mb-2 text-sm font-medium text-red-600">
                {result.failed.length} rows failed:
              </p>
              <ul className="max-h-40 overflow-y-auto text-xs text-red-600">
                {result.failed.map((f) => (
                  <li key={f.row}>Row {f.row}: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => router.push("/entries")}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              View Entries
            </button>
            <button
              onClick={() => {
                setResult(null);
                setParsed([]);
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="rounded border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Import More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import (CSV)</h1>
        <button
          onClick={() => router.push("/entries")}
          className="text-sm text-gray-500 hover:underline"
        >
          Back to entries
        </button>
      </div>

      <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Upload CSV File</h2>
        <p className="mb-4 text-sm text-gray-600">
          Required columns: company, printedSlipNo, date, grossWeight, tareWeight.
          Optional: vendorName, vehicleNumber, driverName, driverContact, vehicleType,
          material, dustWeight, moistureWeight, dustExcluded, moistureExcluded.
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block w-full text-sm text-gray-700 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {headerError && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {headerError}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {parsed.length > 0 && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-green-600">{validCount} valid</span>
              {errorCount > 0 && (
                <span className="ml-3 font-medium text-red-600">{errorCount} errors</span>
              )}
            </div>
            <button
              onClick={handleImport}
              disabled={importing || validCount === 0}
              className="rounded bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {importing ? "Importing..." : `Import ${validCount} Entries`}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Company</th>
                  <th className="px-3 py-2 font-medium">Slip No</th>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Vendor</th>
                  <th className="px-3 py-2 font-medium text-right">Net</th>
                  <th className="px-3 py-2 font-medium text-right">Final</th>
                </tr>
              </thead>
              <tbody>
                {parsed.map((row) => (
                  <tr
                    key={row.rowNum}
                    className={`border-b ${row.error ? "bg-red-50" : ""}`}
                  >
                    <td className="px-3 py-2 text-gray-600">{row.rowNum}</td>
                    <td className="px-3 py-2">
                      {row.error ? (
                        <span className="text-xs text-red-600">{row.error}</span>
                      ) : (
                        <span className="text-xs text-green-600">OK</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {row.preview?.company || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-900">
                      {row.preview?.printedSlipNo || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.preview?.date || "—"}
                    </td>
                    <td className="px-3 py-2 text-gray-600">
                      {row.preview?.vendorName || "—"}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-900">
                      {row.preview?.netWeight ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-semibold text-gray-900">
                      {row.preview?.finalWeight ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
