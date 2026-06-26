import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import PrintView from "./PrintView";

export default async function PrintPage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-gray-500">Loading print view...</p>
        </div>
      }
    >
      <PrintView />
    </Suspense>
  );
}
