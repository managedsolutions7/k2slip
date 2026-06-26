"use client";

import { useState } from "react";
import {
  createCompany,
  updateCompany,
  deleteCompany,
} from "../actions/companies";
import { useRouter } from "next/navigation";

interface CompanyRow {
  _id: string;
  name: string;
  address: string;
  phone: string;
}

export default function CompaniesClient({
  initialCompanies,
}: {
  initialCompanies: CompanyRow[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await createCompany(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Company created", type: "success" });
      setShowCreate(false);
      router.refresh();
    }
  }

  async function handleUpdate(formData: FormData) {
    const result = await updateCompany(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Company updated", type: "success" });
      setEditId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this company?")) return;
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteCompany(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setEditId(null);
            setMessage(null);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "Add Company"}
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 rounded p-3 text-sm ${
            message.type === "error"
              ? "bg-red-50 text-red-600"
              : "bg-green-50 text-green-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {showCreate && (
        <form
          action={handleCreate}
          className="mb-6 rounded border bg-gray-50 p-4"
        >
          <h3 className="mb-3 font-semibold text-gray-900">New Company</h3>
          <div className="grid gap-3">
            <input
              name="name"
              placeholder="Company Name"
              required
              className="rounded border px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="address"
              placeholder="Address"
              required
              className="rounded border px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="phone"
              placeholder="Phone"
              required
              className="rounded border px-3 py-2 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      )}

      <div className="space-y-3">
        {initialCompanies.map((company) => (
          <div key={company._id} className="rounded border bg-white p-4">
            {editId === company._id ? (
              <form action={handleUpdate}>
                <input type="hidden" name="id" value={company._id} />
                <div className="grid gap-3">
                  <input
                    name="name"
                    defaultValue={company.name}
                    required
                    className="rounded border px-3 py-2 text-sm text-gray-900"
                  />
                  <input
                    name="address"
                    defaultValue={company.address}
                    required
                    className="rounded border px-3 py-2 text-sm text-gray-900"
                  />
                  <input
                    name="phone"
                    defaultValue={company.phone}
                    required
                    className="rounded border px-3 py-2 text-sm text-gray-900"
                  />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="submit"
                    className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditId(null)}
                    className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {company.name}
                  </h3>
                  <p className="text-sm text-gray-500">{company.address}</p>
                  <p className="text-sm text-gray-500">{company.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(company._id);
                      setShowCreate(false);
                      setMessage(null);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(company._id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {initialCompanies.length === 0 && (
          <p className="text-sm text-gray-500">
            No companies yet. Add one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
