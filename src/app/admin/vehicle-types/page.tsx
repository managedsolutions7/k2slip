import { getVehicleTypes, createVehicleType, updateVehicleType, deleteVehicleType } from "../actions/master-data";
import MasterListClient from "../MasterListClient";

export default async function VehicleTypesPage() {
  const vehicleTypes = await getVehicleTypes();

  return (
    <MasterListClient
      title="Vehicle Types"
      items={vehicleTypes}
      createAction={createVehicleType}
      updateAction={updateVehicleType}
      deleteAction={deleteVehicleType}
    />
  );
}
