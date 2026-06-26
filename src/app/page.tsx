import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "./LogoutButton";

export default async function Home() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">K2 Weighbridge</h1>
        <div className="flex items-center gap-4">
          {session.user.role === "admin" && (
            <Link
              href="/admin"
              className="rounded bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700 hover:bg-blue-200"
            >
              Admin
            </Link>
          )}
          <span className="text-sm text-gray-600">
            {session.user.username}{" "}
            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {session.user.role}
            </span>
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">
          Welcome. Entry form and past entries coming soon.
        </p>
      </main>
    </div>
  );
}
