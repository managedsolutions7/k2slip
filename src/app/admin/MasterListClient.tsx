"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Item {
  _id: string;
  name: string;
}

interface MasterListClientProps {
  title: string;
  items: Item[];
  createAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  updateAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  deleteAction: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export default function MasterListClient({
  title,
  items,
  createAction,
  updateAction,
  deleteAction,
}: MasterListClientProps) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await createAction(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: `${title.slice(0, -1)} added`, type: "success" });
      setShowCreate(false);
      router.refresh();
    }
  }

  async function handleUpdate(formData: FormData) {
    const result = await updateAction(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Updated", type: "success" });
      setEditId(null);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`Delete this ${title.slice(0, -1).toLowerCase()}?`)) return;
    const formData = new FormData();
    formData.set("id", id);
    const result = await deleteAction(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setEditId(null);
            setMessage(null);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : `Add ${title.slice(0, -1)}`}
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
          className="mb-6 flex gap-3 rounded border bg-gray-50 p-4"
        >
          <input
            name="name"
            placeholder="Name"
            required
            className="flex-1 rounded border px-3 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Add
          </button>
        </form>
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item._id}
            className="flex items-center justify-between rounded border bg-white px-4 py-3"
          >
            {editId === item._id ? (
              <form action={handleUpdate} className="flex flex-1 gap-3">
                <input type="hidden" name="id" value={item._id} />
                <input
                  name="name"
                  defaultValue={item.name}
                  required
                  className="flex-1 rounded border px-3 py-1 text-sm text-gray-900"
                />
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditId(null)}
                  className="rounded border px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <>
                <span className="text-sm font-medium text-gray-900">
                  {item.name}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditId(item._id);
                      setShowCreate(false);
                      setMessage(null);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-gray-500">No items yet.</p>
        )}
      </ul>
    </div>
  );
}
