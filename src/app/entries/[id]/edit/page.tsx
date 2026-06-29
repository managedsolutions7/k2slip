import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { connectDB } from "@/lib/db";
import { Entry } from "@/models/Entry";
import { getEntry } from "../../actions";
import EditEntryForm from "./EditEntryForm";

export default async function EditEntryPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await props.params;

  await connectDB();
  const raw = await Entry.findById(id).lean();
  if (!raw) redirect("/entries");

  if (
    session.user.role !== "admin" &&
    raw.operator.toString() !== session.user.id
  ) {
    redirect("/entries");
  }

  const entry = await getEntry(id);
  if (!entry) redirect("/entries");

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <EditEntryForm entry={entry} />
    </div>
  );
}
