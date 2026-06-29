"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { useRouter } from "next/navigation";
import { getEntries, type EntriesQuery } from "./actions";
import Link from "next/link";

interface CompanyRef {
  _id: string;
  name: string;
}

interface OperatorRef {
  _id: string;
  username: string;
}

interface EntryRow {
  _id: string;
  company: CompanyRef;
  printedSlipNo: string;
  internalId: number;
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
  operator: OperatorRef;
}

interface CompanyOption {
  _id: string;
  name: string;
}

export default function EntriesList({
  userRole,
  userId,
}: {
  userRole: string;
  userId: string;
}) {
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [entries, setEntries] = useState<EntryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [filterCompany, setFilterCompany] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterVendor, setFilterVendor] = useState("");
  const [filterVehicleNumber, setFilterVehicleNumber] = useState("");
  const [filterSlipNo, setFilterSlipNo] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCompanies(data);
      })
      .catch(() => setError("Failed to load companies"));
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const query: EntriesQuery = { page };
    if (filterCompany) query.company = filterCompany;
    if (filterDateFrom) query.dateFrom = filterDateFrom;
    if (filterDateTo) query.dateTo = filterDateTo;
    if (filterVehicle) query.vehicleType = filterVehicle;
    if (filterDriver) query.driverName = filterDriver;
    if (filterVendor) query.vendorName = filterVendor;
    if (filterVehicleNumber) query.vehicleNumber = filterVehicleNumber;
    if (filterSlipNo) query.slipNo = filterSlipNo;

    const result = await getEntries(query);
    if ("entries" in result && result.entries) {
      setEntries(result.entries);
      setTotal(result.total!);
      setTotalPages(result.totalPages!);
      setError("");
    } else if ("error" in result) {
      setError(result.error as string);
    }
    setLoading(false);
  }, [
    page,
    filterCompany,
    filterDateFrom,
    filterDateTo,
    filterVehicle,
    filterDriver,
    filterVendor,
    filterVehicleNumber,
    filterSlipNo,
  ]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchEntries();
  }

  function clearFilters() {
    setFilterCompany("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterVehicle("");
    setFilterDriver("");
    setFilterVendor("");
    setFilterVehicleNumber("");
    setFilterSlipNo("");
    setPage(1);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === entries.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(entries.map((e) => e._id)));
    }
  }

  function printSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected).join(",");
    router.push(`/print?ids=${ids}`);
  }

  function canEdit(entry: EntryRow): boolean {
    return userRole === "admin" || entry.operator._id === userId;
  }

  function formatDustMoisture(
    weight: number | null,
    percent: number | null,
    excluded: boolean,
  ): string {
    if (weight == null) return "—";
    let s = `${weight} kg`;
    if (percent != null) s += ` (${percent}%)`;
    if (excluded) s += " *";
    return s;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center gap-2 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-800 hover:underline">
          Home
        </Link>
        <span>/</span>
        <span className="text-gray-900">Past Entries</span>
      </div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Past Entries</h1>
        <div className="flex gap-3">
          {selected.size > 0 && (
            <button
              onClick={printSelected}
              className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Print Selected ({selected.size})
            </button>
          )}
          <Link
            href="/entries/new"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + New Entry
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            className="rounded border px-3 py-2 text-sm text-gray-900"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="From date"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="date"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder="To date"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            value={filterSlipNo}
            onChange={(e) => setFilterSlipNo(e.target.value)}
            placeholder="Slip no"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            value={filterVendor}
            onChange={(e) => setFilterVendor(e.target.value)}
            placeholder="Vendor name"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            value={filterVehicleNumber}
            onChange={(e) => setFilterVehicleNumber(e.target.value)}
            placeholder="Vehicle number"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            value={filterDriver}
            onChange={(e) => setFilterDriver(e.target.value)}
            placeholder="Driver name"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
          <input
            type="text"
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            placeholder="Vehicle type"
            className="rounded border px-3 py-2 text-sm text-gray-900"
          />
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearFilters}
            className="rounded border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        </div>
      </form>

      {error && (
        <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries found.</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
            <span>{total} entries found</span>
            <button onClick={selectAll} className="hover:underline">
              {selected.size === entries.length ? "Deselect all" : "Select all"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="px-3 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={
                        selected.size === entries.length && entries.length > 0
                      }
                      onChange={selectAll}
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Slip No</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Company</th>
                  <th className="px-3 py-3 font-medium">Vendor</th>
                  <th className="px-3 py-3 font-medium">Vehicle</th>
                  <th className="px-3 py-3 font-medium">Material</th>
                  <th className="px-3 py-3 font-medium text-right">
                    Final Wt (kg)
                  </th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <Fragment key={entry._id}>
                    <tr
                      className={`border-b hover:bg-gray-50 ${
                        selected.has(entry._id) ? "bg-blue-50" : ""
                      }`}
                    >
                      <td className="px-3 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(entry._id)}
                          onChange={() => toggleSelect(entry._id)}
                        />
                      </td>
                      <td className="px-3 py-3 font-medium text-gray-900">
                        {entry.printedSlipNo}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {new Date(entry.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {entry.company.name}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {entry.vendorName || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {entry.vehicleNumber || "—"}
                      </td>
                      <td className="px-3 py-3 text-gray-600">
                        {entry.material}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">
                        {entry.finalWeight}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setExpandedId(
                                expandedId === entry._id ? null : entry._id,
                              )
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {expandedId === entry._id ? "Hide" : "View"}
                          </button>
                          {canEdit(entry) && (
                            <Link
                              href={`/entries/${entry._id}/edit`}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Edit
                            </Link>
                          )}
                          <button
                            onClick={() =>
                              router.push(`/print?ids=${entry._id}`)
                            }
                            className="text-xs text-green-600 hover:underline"
                          >
                            Print
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedId === entry._id && (
                      <tr
                        key={`${entry._id}-detail`}
                        className="border-b bg-gray-50"
                      >
                        <td colSpan={9} className="px-6 py-4">
                          <div className="grid gap-2 text-sm sm:grid-cols-3">
                            <div>
                              <span className="text-gray-500">Vendor: </span>
                              <span className="text-gray-900">
                                {entry.vendorName || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Vehicle No:{" "}
                              </span>
                              <span className="text-gray-900">
                                {entry.vehicleNumber || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Driver: </span>
                              <span className="text-gray-900">
                                {entry.driverName || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Contact: </span>
                              <span className="text-gray-900">
                                {entry.driverContact || "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Vehicle Type:{" "}
                              </span>
                              <span className="text-gray-900">
                                {entry.vehicleType}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Internal ID:{" "}
                              </span>
                              <span className="text-gray-900">
                                {entry.internalId}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Gross: </span>
                              <span className="text-gray-900">
                                {entry.grossWeight} kg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Tare: </span>
                              <span className="text-gray-900">
                                {entry.tareWeight} kg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Net: </span>
                              <span className="text-gray-900">
                                {entry.netWeight} kg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Dust: </span>
                              <span className="text-gray-900">
                                {formatDustMoisture(
                                  entry.dustWeight,
                                  entry.dustPercent,
                                  entry.dustExcluded,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Moisture: </span>
                              <span className="text-gray-900">
                                {formatDustMoisture(
                                  entry.moistureWeight,
                                  entry.moisturePercent,
                                  entry.moistureExcluded,
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Deduction: </span>
                              <span className="text-gray-900">
                                {entry.deduction} kg
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Final: </span>
                              <span className="font-semibold text-gray-900">
                                {entry.finalWeight} kg
                              </span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded border px-3 py-1 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
