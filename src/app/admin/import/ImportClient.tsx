"use client";

import { useState, useRef } from "react";
import { importEntriesFromCSV, type ImportResult } from "../actions/import";

export default function ImportClient() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("Please select a CSV file."); return; }
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Only .csv files are supported.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    const text = await file.text();
    const res = await importEntriesFromCSV(text);
    setResult(res);
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
    setFileName("");
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Step 1 — Download the template
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Fill this template with your historical weighment records. One row = one
          weighment. The <strong>company_name</strong> column must match a company
          already set up in{" "}
          <a href="/admin/companies" className="text-blue-600 hover:underline">
            Admin → Companies
          </a>
          . Use <strong>YYYY-MM-DD</strong> for dates. For dust/moisture, fill
          either the % column or the kg column — not both.
        </p>
        <a
          href="/sample-import.csv"
          download="k2-weighbridge-import-template.csv"
          className="inline-flex items-center gap-2 rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
        >
          ↓ Download CSV Template
        </a>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-semibold text-gray-900">
          Step 2 — Upload your filled CSV
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          Rows with errors are skipped and reported below. Valid rows are imported
          immediately — this cannot be undone.
        </p>

        <form onSubmit={handleUpload} className="flex flex-wrap items-center gap-3">
          <label className="cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            {fileName || "Choose CSV file…"}
            <input
              type="file"
              accept=".csv"
              ref={fileRef}
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !fileName}
            className="rounded bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Importing…" : "Import"}
          </button>
        </form>

        {error && (
          <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-600">{error}</p>
        )}
      </div>

      {result && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Import Results</h2>

          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded bg-gray-50 p-4 text-center">
              <div className="text-3xl font-bold text-gray-900">{result.total}</div>
              <div className="mt-1 text-xs text-gray-500">Rows processed</div>
            </div>
            <div className="rounded bg-green-50 p-4 text-center">
              <div className="text-3xl font-bold text-green-700">{result.imported}</div>
              <div className="mt-1 text-xs text-green-600">Imported</div>
            </div>
            <div
              className={`rounded p-4 text-center ${result.failed.length > 0 ? "bg-red-50" : "bg-gray-50"}`}
            >
              <div
                className={`text-3xl font-bold ${result.failed.length > 0 ? "text-red-700" : "text-gray-900"}`}
              >
                {result.failed.length}
              </div>
              <div
                className={`mt-1 text-xs ${result.failed.length > 0 ? "text-red-600" : "text-gray-500"}`}
              >
                Failed
              </div>
            </div>
          </div>

          {result.failed.length === 0 && result.imported > 0 && (
            <p className="text-sm font-medium text-green-700">
              All {result.imported} rows imported successfully.
            </p>
          )}

          {result.failed.length > 0 && (
            <>
              <h3 className="mb-2 text-sm font-medium text-red-700">Errors to fix:</h3>
              <div className="max-h-64 overflow-y-auto rounded border text-sm">
                <table className="w-full">
                  <thead>
                    <tr className="sticky top-0 border-b bg-gray-50 text-left">
                      <th className="px-3 py-2 font-medium text-gray-600">Row</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.failed.map((f, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-2 text-gray-700">{f.row === 0 ? "—" : f.row}</td>
                        <td className="px-3 py-2 text-red-600">{f.error}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
