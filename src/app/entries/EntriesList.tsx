"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getEntries, type EntriesQuery } from "./actions";
import Link from "next/link";

interface CompanyRef {
  _id: string;
  name: string;
}

interface EntryRow {
  _id: string;
  company: CompanyRef;
  printedSlipNo: string;
  internalId: number;
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

interface CompanyOption {
  _id: string;
  name: string;
}

export default function EntriesList() {
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
  const [filterSlipNo, setFilterSlipNo] = useState("");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then(setCompanies);
  }, []);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const query: EntriesQuery = { page };
    if (filterCompany) query.company = filterCompany;
    if (filterDateFrom) query.dateFrom = filterDateFrom;
    if (filterDateTo) query.dateTo = filterDateTo;
    if (filterVehicle) query.vehicleType = filterVehicle;
    if (filterDriver) query.driverName = filterDriver;
    if (filterSlipNo) query.slipNo = filterSlipNo;

    const result = await getEntries(query);
    if ("entries" in result && result.entries) {
      setEntries(result.entries);
      setTotal(result.total!);
      setTotalPages(result.totalPages!);
    }
    setLoading(false);
  }, [page, filterCompany, filterDateFrom, filterDateTo, filterVehicle, filterDriver, filterSlipNo]);

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
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
            New Entry
          </Link>
        </div>
      </div>

      <form
        onSubmit={handleSearch}
        className="mb-6 rounded-lg border bg-white p-4 shadow-sm"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
            value={filterVehicle}
            onChange={(e) => setFilterVehicle(e.target.value)}
            placeholder="Vehicle type"
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
            value={filterSlipNo}
            onChange={(e) => setFilterSlipNo(e.target.value)}
            placeholder="Slip no"
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

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-gray-500">No entries found.</p>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
            <span>{total} entries found</span>
            <button onClick={selectAll} className="hover:underline">
              {selected.size === entries.length
                ? "Deselect all"
                : "Select all"}
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-gray-500">
                  <th className="px-3 py-3 font-medium">
                    <input
                      type="checkbox"
                      checked={selected.size === entries.length && entries.length > 0}
                      onChange={selectAll}
                    />
                  </th>
                  <th className="px-3 py-3 font-medium">Slip No</th>
                  <th className="px-3 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 font-medium">Company</th>
                  <th className="px-3 py-3 font-medium">Driver</th>
                  <th className="px-3 py-3 font-medium">Material</th>
                  <th className="px-3 py-3 font-medium text-right">
                    Final Wt (kg)
                  </th>
                  <th className="px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <>
                    <tr
                      key={entry._id}
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
                        {entry.driverName}
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
                                expandedId === entry._id ? null : entry._id
                              )
                            }
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {expandedId === entry._id ? "Hide" : "View"}
                          </button>
                          <Link
                            href={`/entries/${entry._id}/edit`}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </Link>
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
                      <tr key={`${entry._id}-detail`} className="border-b bg-gray-50">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid gap-2 text-sm sm:grid-cols-3">
                            <div>
                              <span className="text-gray-500">Vehicle: </span>
                              <span className="text-gray-900">
                                {entry.vehicleType}
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
                                {entry.dustPercent != null
                                  ? `${entry.dustPercent}% (${entry.dustWeight} kg)`
                                  : "—"}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Moisture: </span>
                              <span className="text-gray-900">
                                {entry.moisturePercent != null
                                  ? `${entry.moisturePercent}% (${entry.moistureWeight} kg)`
                                  : "—"}
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
                  </>
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
