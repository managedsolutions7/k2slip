"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const adminNav = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/companies", label: "Companies" },
  { href: "/admin/materials", label: "Materials" },
  { href: "/admin/vehicle-types", label: "Vehicle Types" },
  { href: "/admin/import", label: "Bulk Import" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-52 shrink-0 border-r bg-gray-50 p-4">
      <ul className="space-y-1">
        {adminNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <hr className="my-4" />
      <Link
        href="/"
        className="block rounded px-3 py-2 text-sm text-gray-500 hover:bg-gray-200"
      >
        ← Back to App
      </Link>
    </nav>
  );
}
