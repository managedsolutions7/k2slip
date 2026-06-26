import ImportClient from "./ImportClient";

export default function ImportPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Bulk Import</h1>
      <p className="mb-6 text-sm text-gray-500">
        Import historical weighment records from a CSV file.
      </p>
      <ImportClient />
    </div>
  );
}
