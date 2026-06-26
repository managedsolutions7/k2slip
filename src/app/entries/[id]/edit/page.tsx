import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getEntry } from "../../actions";
import EditEntryForm from "./EditEntryForm";

export default async function EditEntryPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await props.params;
  const entry = await getEntry(id);
  if (!entry) redirect("/entries");

  return (
    <div className="min-h-screen bg-gray-50">
      <EditEntryForm entry={entry} />
    </div>
  );
}
