import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ImportClient from "./ImportClient";

export default async function ImportPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-50">
      <ImportClient />
    </div>
  );
}
