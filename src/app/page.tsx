import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "./components/AppHeader";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <AppHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className={`grid gap-5 ${isAdmin ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
          <Link
            href="/entries/new"
            className="flex flex-col items-center rounded-xl border bg-white px-10 py-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-4xl">+</span>
            <span className="mt-3 text-lg font-semibold text-gray-900">New Entry</span>
            <span className="mt-1 text-sm text-gray-500">Create a weighment</span>
          </Link>
          <Link
            href="/entries"
            className="flex flex-col items-center rounded-xl border bg-white px-10 py-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-4xl">📋</span>
            <span className="mt-3 text-lg font-semibold text-gray-900">Past Entries</span>
            <span className="mt-1 text-sm text-gray-500">Search &amp; reprint</span>
          </Link>
          {isAdmin && (
            <Link
              href="/admin/import"
              className="flex flex-col items-center rounded-xl border bg-white px-10 py-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="text-4xl">⬆</span>
              <span className="mt-3 text-lg font-semibold text-gray-900">Bulk Import</span>
              <span className="mt-1 text-sm text-gray-500">Import from CSV</span>
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
