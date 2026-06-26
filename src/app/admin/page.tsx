import Link from "next/link";

const cards = [
  { href: "/admin/users", label: "Users", desc: "Manage operator and admin accounts" },
  { href: "/admin/companies", label: "Companies", desc: "Manage slip header companies" },
  { href: "/admin/materials", label: "Materials", desc: "Master list of materials" },
  { href: "/admin/vehicle-types", label: "Vehicle Types", desc: "Master list of vehicle types" },
  { href: "/admin/import", label: "Bulk Import", desc: "Import historical records from CSV" },
];

export default function AdminPage() {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <h3 className="font-semibold text-gray-900">{card.label}</h3>
            <p className="mt-1 text-sm text-gray-500">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
