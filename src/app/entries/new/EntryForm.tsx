"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { computeNet, derivePercent } from "@/lib/calc";
import { createEntry } from "../actions";
import ComboBox from "../ComboBox";

interface Company {
  _id: string;
  name: string;
}

function toNum(val: string): number | null {
  if (val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export default function EntryForm() {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const [company, setCompany] = useState("");
  const [printedSlipNo, setPrintedSlipNo] = useState("");
  const [date, setDate] = useState(formatDate(new Date()));
  const [vendorName, setVendorName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverContact, setDriverContact] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [material, setMaterial] = useState("");

  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");

  const [dustWeightStr, setDustWeightStr] = useState("");
  const [moistureWeightStr, setMoistureWeightStr] = useState("");
  const [dustExcluded, setDustExcluded] = useState(false);
  const [moistureExcluded, setMoistureExcluded] = useState(false);

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/materials").then((r) => r.json()),
      fetch("/api/vehicle-types").then((r) => r.json()),
    ])
      .then(([c, m, v]) => {
        if (Array.isArray(c)) setCompanies(c);
        if (Array.isArray(m))
          setMaterials(m.map((x: { name: string }) => x.name));
        if (Array.isArray(v))
          setVehicleTypes(v.map((x: { name: string }) => x.name));
      })
      .catch(() => {
        setError("Failed to load form data. Please refresh.");
      });
  }, []);

  const calc = useMemo(() => {
    const g = toNum(grossWeight);
    const t = toNum(tareWeight);
    if (g == null || t == null) return null;

    const net = computeNet(g, t);
    const dw = toNum(dustWeightStr);
    const mw = toNum(moistureWeightStr);

    const dustPercent =
      dw != null && dw !== 0 && net !== 0 ? derivePercent(net, dw) : null;
    const moisturePercent =
      mw != null && mw !== 0 && net !== 0 ? derivePercent(net, mw) : null;

    const includedDust = !dustExcluded ? (dw ?? 0) : 0;
    const includedMoisture = !moistureExcluded ? (mw ?? 0) : 0;
    const deduction = Math.max(includedDust, includedMoisture);
    const finalWeight = Math.round((net - deduction) * 100) / 100;

    return { net, dustPercent, moisturePercent, deduction, finalWeight };
  }, [
    grossWeight,
    tareWeight,
    dustWeightStr,
    moistureWeightStr,
    dustExcluded,
    moistureExcluded,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const result = await createEntry({
      company,
      printedSlipNo,
      date,
      vendorName,
      vehicleNumber,
      driverName,
      driverContact,
      vehicleType,
      material,
      grossWeight: toNum(grossWeight) ?? 0,
      tareWeight: toNum(tareWeight) ?? 0,
      dustWeight: toNum(dustWeightStr),
      moistureWeight: toNum(moistureWeightStr),
      dustExcluded,
      moistureExcluded,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSavedEntryId(result.entryId!);
    }
  }

  function handleNewEntry() {
    setSavedEntryId(null);
    setPrintedSlipNo("");
    setVendorName("");
    setVehicleNumber("");
    setDriverName("");
    setDriverContact("");
    setGrossWeight("");
    setTareWeight("");
    setDustWeightStr("");
    setMoistureWeightStr("");
    setDustExcluded(false);
    setMoistureExcluded(false);
    setDate(formatDate(new Date()));
  }

  if (savedEntryId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-lg border bg-white p-8 text-center shadow">
          <div className="mb-4 text-4xl text-green-500">&#10003;</div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">Entry Saved</h2>
          <p className="mb-6 text-sm text-gray-500">
            Slip #{printedSlipNo} saved successfully.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/print?ids=${savedEntryId}`)}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Print This Slip
            </button>
            <button
              onClick={handleNewEntry}
              className="rounded border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              New Entry
            </button>
            <button
              onClick={() => router.push("/")}
              className="rounded border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <button
          onClick={() => router.push("/entries")}
          className="hover:text-gray-800 hover:underline"
        >
          Past Entries
        </button>
        <span>/</span>
        <span className="text-gray-900">New Entry</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          New Weighment Entry
        </h1>
        <button
          onClick={() => router.push("/entries")}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← Back to Entries
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Basic Information
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company
              </label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Printed Slip No
              </label>
              <input
                type="text"
                value={printedSlipNo}
                onChange={(e) => setPrintedSlipNo(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Slip book number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Party / supplier name"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Driver & Vehicle
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vehicle Number
              </label>
              <input
                type="text"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Driver Name
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Driver Contact No
              </label>
              <input
                type="text"
                value={driverContact}
                onChange={(e) => setDriverContact(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <ComboBox
              label="Vehicle Type"
              options={vehicleTypes}
              value={vehicleType}
              onChange={setVehicleType}
              required
            />
            <ComboBox
              label="Type of Material"
              options={materials}
              value={material}
              onChange={setMaterial}
              required
            />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Weights (kg)
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gross Weight
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tare Weight
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={tareWeight}
                onChange={(e) => setTareWeight(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Net Weight
              </label>
              <div className="mt-1 flex h-[38px] items-center rounded border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                {calc ? `${calc.net} kg` : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Deductions (Optional)
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dust Weight (kg)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={dustWeightStr}
                onChange={(e) => setDustWeightStr(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter kg"
              />
              {calc?.dustPercent != null && (
                <p className="mt-1 text-xs text-gray-500">
                  = {calc.dustPercent}%
                </p>
              )}
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={dustExcluded}
                  onChange={(e) => setDustExcluded(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Exclude from deduction
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Moisture Weight (kg)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={moistureWeightStr}
                onChange={(e) => setMoistureWeightStr(e.target.value)}
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter kg"
              />
              {calc?.moisturePercent != null && (
                <p className="mt-1 text-xs text-gray-500">
                  = {calc.moisturePercent}%
                </p>
              )}
              <label className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={moistureExcluded}
                  onChange={(e) => setMoistureExcluded(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Exclude from deduction
              </label>
            </div>
          </div>
          {(dustWeightStr || moistureWeightStr) && (
            <button
              type="button"
              onClick={() => {
                setDustWeightStr("");
                setMoistureWeightStr("");
                setDustExcluded(false);
                setMoistureExcluded(false);
              }}
              className="mt-3 text-xs text-gray-500 hover:underline"
            >
              Clear deductions
            </button>
          )}
        </div>

        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold text-gray-900">
                Final Weight
              </span>
              {calc && calc.deduction > 0 && (
                <span className="ml-3 text-sm text-gray-500">
                  (deduction: {calc.deduction} kg)
                </span>
              )}
            </div>
            <span className="text-2xl font-bold text-blue-700">
              {calc ? `${calc.finalWeight} kg` : "—"}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Entry"}
        </button>
      </form>
    </div>
  );
}
