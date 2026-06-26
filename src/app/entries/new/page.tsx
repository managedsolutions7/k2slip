import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import EntryForm from "./EntryForm";

export default async function NewEntryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <EntryForm />
    </div>
  );
}
