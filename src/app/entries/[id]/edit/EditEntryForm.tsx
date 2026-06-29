"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { computeNet, derivePercent } from "@/lib/calc";
import { updateEntry } from "../../actions";
import ComboBox from "../../ComboBox";

interface Company {
  _id: string;
  name: string;
}

interface EntryData {
  _id: string;
  company: { _id: string; name: string };
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
  netWeight: number;
  dustWeight: number | null;
  dustPercent: number | null;
  moistureWeight: number | null;
  moisturePercent: number | null;
  dustExcluded: boolean;
  moistureExcluded: boolean;
  deduction: number;
  finalWeight: number;
}

function toNum(val: string): number | null {
  if (val === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

export default function EditEntryForm({ entry }: { entry: EntryData }) {
  const router = useRouter();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  const [company, setCompany] = useState(entry.company._id);
  const [printedSlipNo, setPrintedSlipNo] = useState(entry.printedSlipNo);
  const [date, setDate] = useState(entry.date);
  const [vendorName, setVendorName] = useState(entry.vendorName || "");
  const [vehicleNumber, setVehicleNumber] = useState(entry.vehicleNumber || "");
  const [driverName, setDriverName] = useState(entry.driverName);
  const [driverContact, setDriverContact] = useState(entry.driverContact);
  const [vehicleType, setVehicleType] = useState(entry.vehicleType);
  const [material, setMaterial] = useState(entry.material);

  const [grossWeight, setGrossWeight] = useState(entry.grossWeight.toString());
  const [tareWeight, setTareWeight] = useState(entry.tareWeight.toString());

  const [dustWeightStr, setDustWeightStr] = useState(
    entry.dustWeight != null ? entry.dustWeight.toString() : "",
  );
  const [moistureWeightStr, setMoistureWeightStr] = useState(
    entry.moistureWeight != null ? entry.moistureWeight.toString() : "",
  );
  const [dustExcluded, setDustExcluded] = useState(entry.dustExcluded ?? false);
  const [moistureExcluded, setMoistureExcluded] = useState(
    entry.moistureExcluded ?? false,
  );

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

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

    const result = await updateEntry(entry._id, {
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
      router.push("/entries");
      router.refresh();
    }
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
        <span className="text-gray-900">Edit Entry</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Entry</h1>
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
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
          {saving ? "Saving..." : "Update Entry"}
        </button>
      </form>
    </div>
  );
}
