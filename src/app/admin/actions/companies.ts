"use server";

import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
}

export async function getCompanies() {
  await requireAdmin();
  await connectDB();
  const companies = await Company.find().sort({ name: 1 }).lean();
  return companies.map((c) => ({
    _id: c._id.toString(),
    name: c.name,
    address: c.address,
    phone: c.phone,
  }));
}

export async function createCompany(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!name || !address || !phone) {
    return { error: "All fields are required" };
  }

  await Company.create({ name, address, phone });
  revalidatePath("/admin/companies");
  return { success: true };
}

export async function updateCompany(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  const name = (formData.get("name") as string)?.trim();
  const address = (formData.get("address") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim();

  if (!id || !name || !address || !phone) {
    return { error: "All fields are required" };
  }

  const company = await Company.findByIdAndUpdate(id, { name, address, phone });
  if (!company) return { error: "Company not found" };

  revalidatePath("/admin/companies");
  return { success: true };
}

export async function deleteCompany(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const id = formData.get("id") as string;
  if (!id) return { error: "ID is required" };

  await Company.findByIdAndDelete(id);
  revalidatePath("/admin/companies");
  return { success: true };
}
