import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from "../actions/master-data";
import MasterListClient from "../MasterListClient";

export default async function MaterialsPage() {
  const materials = await getMaterials();

  return (
    <MasterListClient
      title="Materials"
      items={materials}
      createAction={createMaterial}
      updateAction={updateMaterial}
      deleteAction={deleteMaterial}
    />
  );
}
