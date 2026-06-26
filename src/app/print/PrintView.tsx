"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface PrintEntry {
  _id: string;
  company: {
    name: string;
    address: string;
    phone: string;
  };
  printedSlipNo: string;
  date: string;
  driverName: string;
  driverContact: string;
  vehicleType: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  dustPercent: number | null;
  dustWeight: number | null;
  moisturePercent: number | null;
  moistureWeight: number | null;
  finalWeight: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function SlipCard({ entry }: { entry: PrintEntry }) {
  return (
    <div className="slip">
      <div className="slip-header">
        <div className="company-name">{entry.company.name}</div>
        <div className="company-detail">{entry.company.address}</div>
        <div className="company-detail">Phone: {entry.company.phone}</div>
      </div>

      <div className="slip-body">
        <div className="slip-row">
          <span>
            <strong>Slip No:</strong> {entry.printedSlipNo}
          </span>
          <span>
            <strong>Date:</strong> {formatDate(entry.date)}
          </span>
        </div>

        <div className="slip-row">
          <span>
            <strong>Driver:</strong> {entry.driverName}
          </span>
          <span>
            <strong>Contact:</strong> {entry.driverContact || "—"}
          </span>
        </div>

        <div className="slip-row">
          <span>
            <strong>Vehicle:</strong> {entry.vehicleType}
          </span>
          <span>
            <strong>Material:</strong> {entry.material}
          </span>
        </div>

        <table className="weights-table">
          <tbody>
            <tr>
              <td>Gross Weight</td>
              <td className="weight-val">{entry.grossWeight} kg</td>
              <td>Tare Weight</td>
              <td className="weight-val">{entry.tareWeight} kg</td>
            </tr>
            <tr>
              <td>Net Weight</td>
              <td className="weight-val">{entry.netWeight} kg</td>
              <td></td>
              <td></td>
            </tr>
            {(entry.dustPercent != null || entry.moisturePercent != null) && (
              <tr>
                <td>Dust</td>
                <td className="weight-val">
                  {entry.dustPercent != null
                    ? `${entry.dustPercent}% (${entry.dustWeight} kg)`
                    : "—"}
                </td>
                <td>Moisture</td>
                <td className="weight-val">
                  {entry.moisturePercent != null
                    ? `${entry.moisturePercent}% (${entry.moistureWeight} kg)`
                    : "—"}
                </td>
              </tr>
            )}
            <tr className="final-row">
              <td>
                <strong>Final Weight (After Deduction)</strong>
              </td>
              <td colSpan={3} className="weight-val final-weight">
                {entry.finalWeight} kg
              </td>
            </tr>
          </tbody>
        </table>

        <div className="signature-line">
          <span>Signature: ________________________</span>
        </div>

        <div className="slip-footer">
          Goods once weighed will not be taken back. Thank You!
        </div>
      </div>
    </div>
  );
}

export default function PrintView() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [entries, setEntries] = useState<PrintEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = searchParams.get("ids") || "";

  useEffect(() => {
    if (!ids) return;
    fetch(`/api/entries?ids=${ids}`)
      .then((r) => r.json())
      .then((data) => {
        setEntries(data);
        setLoading(false);
      });
  }, [ids]);

  function handlePrint() {
    window.print();
  }

  if (!ids) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">No entries selected for printing.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="no-print mx-auto max-w-3xl px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Print Preview</h1>
            <p className="text-sm text-gray-500">
              {entries.length} slip{entries.length !== 1 ? "s" : ""} —{" "}
              {Math.ceil(entries.length / 3)} page
              {Math.ceil(entries.length / 3) !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700"
            >
              Print
            </button>
            <button
              onClick={() => router.back()}
              className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="print-area">
        {entries.map((entry, index) => (
          <div key={entry._id}>
            <SlipCard entry={entry} />
            {(index + 1) % 3 === 0 && index + 1 < entries.length && (
              <div className="page-break" />
            )}
          </div>
        ))}
      </div>
    </>
  );
}
