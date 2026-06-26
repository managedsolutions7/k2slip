import { auth } from "@/lib/auth";
import Link from "next/link";
import LogoutButton from "@/app/LogoutButton";

export default async function AppHeader() {
  const session = await auth();
  if (!session) return null;

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
      <Link href="/" className="text-xl font-bold text-gray-900 hover:text-gray-700">
        K2 Weighbridge
      </Link>
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
          {session.user.username}
          <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {session.user.role}
          </span>
        </span>
        <LogoutButton />
      </div>
    </header>
  );
}
