"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  computeNet,
  dustWeightFromPercent,
  dustPercentFromWeight,
  moistureWeightFromPercent,
  moisturePercentFromWeight,
  computeFinal,
} from "@/lib/calc";
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
  const [driverName, setDriverName] = useState(entry.driverName);
  const [driverContact, setDriverContact] = useState(entry.driverContact);
  const [vehicleType, setVehicleType] = useState(entry.vehicleType);
  const [material, setMaterial] = useState(entry.material);

  const [grossWeight, setGrossWeight] = useState(entry.grossWeight.toString());
  const [tareWeight, setTareWeight] = useState(entry.tareWeight.toString());
  const [netWeight, setNetWeight] = useState<number | null>(entry.netWeight);

  const initDustMode = entry.dustPercent != null ? "percent" : entry.dustWeight != null ? "weight" : null;
  const initMoistureMode = entry.moisturePercent != null ? "percent" : entry.moistureWeight != null ? "weight" : null;

  const [dustPercentStr, setDustPercentStr] = useState(
    entry.dustPercent != null ? entry.dustPercent.toString() : ""
  );
  const [dustWeightStr, setDustWeightStr] = useState(
    entry.dustWeight != null ? entry.dustWeight.toString() : ""
  );
  const [dustEditMode, setDustEditMode] = useState<"percent" | "weight" | null>(initDustMode);

  const [moisturePercentStr, setMoisturePercentStr] = useState(
    entry.moisturePercent != null ? entry.moisturePercent.toString() : ""
  );
  const [moistureWeightStr, setMoistureWeightStr] = useState(
    entry.moistureWeight != null ? entry.moistureWeight.toString() : ""
  );
  const [moistureEditMode, setMoistureEditMode] = useState<"percent" | "weight" | null>(initMoistureMode);

  const [finalWeightVal, setFinalWeight] = useState<number | null>(entry.finalWeight);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/materials").then((r) => r.json()),
      fetch("/api/vehicle-types").then((r) => r.json()),
    ]).then(([c, m, v]) => {
      setCompanies(c);
      setMaterials(m.map((x: { name: string }) => x.name));
      setVehicleTypes(v.map((x: { name: string }) => x.name));
    });
  }, []);

  const recalc = useCallback(() => {
    const g = toNum(grossWeight);
    const t = toNum(tareWeight);

    if (g == null || t == null) {
      setNetWeight(null);
      setFinalWeight(null);
      return;
    }

    const net = computeNet(g, t);
    setNetWeight(net);

    let dW: number | null = null;
    let mW: number | null = null;

    if (dustEditMode === "percent") {
      const dp = toNum(dustPercentStr);
      if (dp != null && dp !== 0) {
        dW = dustWeightFromPercent(net, dp);
        setDustWeightStr(dW.toString());
      } else {
        setDustWeightStr("");
      }
    } else if (dustEditMode === "weight") {
      const dw = toNum(dustWeightStr);
      if (dw != null && dw !== 0 && net !== 0) {
        const dp = dustPercentFromWeight(net, dw);
        setDustPercentStr(dp.toString());
        dW = dw;
      } else {
        setDustPercentStr("");
      }
    }

    if (moistureEditMode === "percent") {
      const mp = toNum(moisturePercentStr);
      if (mp != null && mp !== 0) {
        mW = moistureWeightFromPercent(net, mp);
        setMoistureWeightStr(mW.toString());
      } else {
        setMoistureWeightStr("");
      }
    } else if (moistureEditMode === "weight") {
      const mw = toNum(moistureWeightStr);
      if (mw != null && mw !== 0 && net !== 0) {
        const mp = moisturePercentFromWeight(net, mw);
        setMoisturePercentStr(mp.toString());
        mW = mw;
      } else {
        setMoisturePercentStr("");
      }
    }

    setFinalWeight(computeFinal(net, dW, mW));
  }, [grossWeight, tareWeight, dustPercentStr, dustWeightStr, dustEditMode, moisturePercentStr, moistureWeightStr, moistureEditMode]);

  useEffect(() => {
    recalc();
  }, [recalc]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const result = await updateEntry(entry._id, {
      company,
      printedSlipNo,
      date,
      driverName,
      driverContact,
      vehicleType,
      material,
      grossWeight: toNum(grossWeight) ?? 0,
      tareWeight: toNum(tareWeight) ?? 0,
      dustPercent: dustEditMode === "percent" ? toNum(dustPercentStr) : null,
      dustWeight: dustEditMode === "weight" ? toNum(dustWeightStr) : null,
      moisturePercent: moistureEditMode === "percent" ? toNum(moisturePercentStr) : null,
      moistureWeight: moistureEditMode === "weight" ? toNum(moistureWeightStr) : null,
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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Edit Entry</h1>
        <button
          onClick={() => router.push("/entries")}
          className="text-sm text-gray-500 hover:underline"
        >
          Back to entries
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Basic Information</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Company</label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select company</option>
                {companies.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Printed Slip No</label>
              <input
                type="text"
                value={printedSlipNo}
                onChange={(e) => setPrintedSlipNo(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Driver & Vehicle</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Name</label>
              <input type="text" value={driverName} onChange={(e) => setDriverName(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Driver Contact No</label>
              <input type="text" value={driverContact} onChange={(e) => setDriverContact(e.target.value)} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
            </div>
            <ComboBox label="Vehicle Type" options={vehicleTypes} value={vehicleType} onChange={setVehicleType} required />
            <ComboBox label="Type of Material" options={materials} value={material} onChange={setMaterial} required />
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Weights (kg)</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Gross Weight</label>
              <input type="number" step="any" min="0" value={grossWeight} onChange={(e) => setGrossWeight(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Tare Weight</label>
              <input type="number" step="any" min="0" value={tareWeight} onChange={(e) => setTareWeight(e.target.value)} required className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Net Weight</label>
              <div className="mt-1 flex h-[38px] items-center rounded border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-900">
                {netWeight != null ? `${netWeight} kg` : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Deductions (Optional)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dust %</label>
              <input type="number" step="any" min="0" max="100" value={dustPercentStr} onChange={(e) => { setDustPercentStr(e.target.value); setDustEditMode(e.target.value ? "percent" : null); if (!e.target.value) setDustWeightStr(""); }} disabled={dustEditMode === "weight"} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Dust Weight (kg)</label>
              <input type="number" step="any" min="0" value={dustWeightStr} onChange={(e) => { setDustWeightStr(e.target.value); setDustEditMode(e.target.value ? "weight" : null); if (!e.target.value) setDustPercentStr(""); }} disabled={dustEditMode === "percent"} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Moisture %</label>
              <input type="number" step="any" min="0" max="100" value={moisturePercentStr} onChange={(e) => { setMoisturePercentStr(e.target.value); setMoistureEditMode(e.target.value ? "percent" : null); if (!e.target.value) setMoistureWeightStr(""); }} disabled={moistureEditMode === "weight"} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Moisture Weight (kg)</label>
              <input type="number" step="any" min="0" value={moistureWeightStr} onChange={(e) => { setMoistureWeightStr(e.target.value); setMoistureEditMode(e.target.value ? "weight" : null); if (!e.target.value) setMoisturePercentStr(""); }} disabled={moistureEditMode === "percent"} className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" />
            </div>
          </div>
          {(dustEditMode || moistureEditMode) && (
            <button type="button" onClick={() => { setDustPercentStr(""); setDustWeightStr(""); setDustEditMode(null); setMoisturePercentStr(""); setMoistureWeightStr(""); setMoistureEditMode(null); }} className="mt-3 text-xs text-gray-500 hover:underline">
              Clear deductions
            </button>
          )}
        </div>

        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Final Weight</span>
            <span className="text-2xl font-bold text-blue-700">
              {finalWeightVal != null ? `${finalWeightVal} kg` : "—"}
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
