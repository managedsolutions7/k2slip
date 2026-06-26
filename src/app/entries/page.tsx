import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EntriesList from "./EntriesList";

export default async function EntriesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <EntriesList />;
}
