"use server";

import { connectDB } from "@/lib/db";
import { Material } from "@/models/Material";
import { VehicleType } from "@/models/VehicleType";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

// --- Materials ---

export async function getMaterials() {
  await requireAdmin();
  await connectDB();
  const materials = await Material.find().sort({ name: 1 }).lean();
  return materials.map((m) => ({
    _id: m._id.toString(),
    name: m.name,
  }));
}

export async function createMaterial(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const existing = await Material.findOne({ name });
  if (existing) return { error: "Material already exists" };

  await Material.create({ name });
  revalidatePath("/admin/materials");
  return { success: true };
}

export async function updateMaterial(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return { error: "ID and name are required" };

  const existing = await Material.findOne({ name, _id: { $ne: id } });
  if (existing) return { error: "Material name already exists" };

  const material = await Material.findByIdAndUpdate(id, { name });
  if (!material) return { error: "Material not found" };

  revalidatePath("/admin/materials");
  return { success: true };
}

export async function deleteMaterial(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  if (!id) return { error: "ID is required" };

  await Material.findByIdAndDelete(id);
  revalidatePath("/admin/materials");
  return { success: true };
}

// --- Vehicle Types ---

export async function getVehicleTypes() {
  await requireAdmin();
  await connectDB();
  const types = await VehicleType.find().sort({ name: 1 }).lean();
  return types.map((t) => ({
    _id: t._id.toString(),
    name: t.name,
  }));
}

export async function createVehicleType(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Name is required" };

  const existing = await VehicleType.findOne({ name });
  if (existing) return { error: "Vehicle type already exists" };

  await VehicleType.create({ name });
  revalidatePath("/admin/vehicle-types");
  return { success: true };
}

export async function updateVehicleType(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  if (!id || !name) return { error: "ID and name are required" };

  const existing = await VehicleType.findOne({ name, _id: { $ne: id } });
  if (existing) return { error: "Vehicle type name already exists" };

  const vt = await VehicleType.findByIdAndUpdate(id, { name });
  if (!vt) return { error: "Vehicle type not found" };

  revalidatePath("/admin/vehicle-types");
  return { success: true };
}

export async function deleteVehicleType(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  if (!id) return { error: "ID is required" };

  await VehicleType.findByIdAndDelete(id);
  revalidatePath("/admin/vehicle-types");
  return { success: true };
}
