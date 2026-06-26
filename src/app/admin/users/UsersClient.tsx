"use client";

import { useState } from "react";
import { createUser, resetPassword, toggleUserRole } from "../actions/users";
import { useRouter } from "next/navigation";

interface UserRow {
  _id: string;
  username: string;
  role: string;
  createdAt: string;
}

export default function UsersClient({
  initialUsers,
}: {
  initialUsers: UserRow[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    text: string;
    type: "error" | "success";
  } | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await createUser(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "User created", type: "success" });
      setShowCreate(false);
      router.refresh();
    }
  }

  async function handleResetPassword(formData: FormData) {
    const result = await resetPassword(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      setMessage({ text: "Password reset", type: "success" });
      setResetUserId(null);
    }
  }

  async function handleToggleRole(formData: FormData) {
    const result = await toggleUserRole(formData);
    if (result?.error) {
      setMessage({ text: result.error, type: "error" });
    } else {
      router.refresh();
    }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Users</h2>
        <button
          onClick={() => {
            setShowCreate(!showCreate);
            setMessage(null);
          }}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "Cancel" : "Create User"}
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
          <h3 className="mb-3 font-semibold text-gray-900">New User</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              name="username"
              placeholder="Username"
              required
              className="rounded border px-3 py-2 text-sm text-gray-900"
            />
            <input
              name="password"
              type="password"
              placeholder="Password (min 6)"
              required
              minLength={6}
              className="rounded border px-3 py-2 text-sm text-gray-900"
            />
            <select
              name="role"
              required
              className="rounded border px-3 py-2 text-sm text-gray-900"
            >
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-3 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      )}

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="pb-2 font-medium">Username</th>
            <th className="pb-2 font-medium">Role</th>
            <th className="pb-2 font-medium">Created</th>
            <th className="pb-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {initialUsers.map((user) => (
            <tr key={user._id} className="border-b">
              <td className="py-3 font-medium text-gray-900">
                {user.username}
              </td>
              <td className="py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="py-3 text-gray-500">
                {new Date(user.createdAt).toLocaleDateString()}
              </td>
              <td className="py-3">
                <div className="flex gap-2">
                  <form action={handleToggleRole}>
                    <input type="hidden" name="userId" value={user._id} />
                    <button
                      type="submit"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Make {user.role === "admin" ? "Operator" : "Admin"}
                    </button>
                  </form>
                  <button
                    onClick={() => {
                      setResetUserId(
                        resetUserId === user._id ? null : user._id
                      );
                      setMessage(null);
                    }}
                    className="text-xs text-gray-600 hover:underline"
                  >
                    Reset Password
                  </button>
                </div>
                {resetUserId === user._id && (
                  <form action={handleResetPassword} className="mt-2 flex gap-2">
                    <input type="hidden" name="userId" value={user._id} />
                    <input
                      name="newPassword"
                      type="password"
                      placeholder="New password"
                      required
                      minLength={6}
                      className="rounded border px-2 py-1 text-xs text-gray-900"
                    />
                    <button
                      type="submit"
                      className="rounded bg-gray-800 px-3 py-1 text-xs text-white hover:bg-gray-900"
                    >
                      Set
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
