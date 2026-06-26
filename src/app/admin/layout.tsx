import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LogoutButton from "../LogoutButton";

const adminNav = [
  { href: "/admin/users", label: "Users" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/vehicle-types", label: "Vehicle Types" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-gray-900">
            K2 Weighbridge
          </Link>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user.username}</span>
          <LogoutButton />
        </div>
      </header>
      <div className="flex flex-1">
        <nav className="w-52 border-r bg-gray-50 p-4">
          <ul className="space-y-1">
            {adminNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <hr className="my-4" />
          <Link
            href="/"
            className="block rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-200"
          >
            Back to App
          </Link>
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
