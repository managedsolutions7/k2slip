import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import EntriesList from "./EntriesList";

export default async function EntriesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <EntriesList userRole={session.user.role} userId={session.user.id} />
    </div>
  );
}
