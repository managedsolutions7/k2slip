"use server";

import { connectDB } from "@/lib/db";
import { Entry } from "@/models/Entry";
import { Company } from "@/models/Company";
import { auth } from "@/lib/auth";
import { computeAll } from "@/lib/calc";

export interface EntryFormData {
  company: string;
  printedSlipNo: string;
  date: string;
  driverName: string;
  driverContact: string;
  vehicleType: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  dustPercent: number | null;
  dustWeight: number | null;
  moisturePercent: number | null;
  moistureWeight: number | null;
}

export async function createEntry(data: EntryFormData) {
  const session = await auth();
  if (!session) {
    return { error: "Unauthorized" };
  }

  await connectDB();

  if (!data.company) return { error: "Company is required" };
  if (!data.printedSlipNo?.trim()) return { error: "Printed Slip No is required" };
  if (!data.date) return { error: "Date is required" };
  if (!data.driverName?.trim()) return { error: "Driver Name is required" };
  if (!data.vehicleType?.trim()) return { error: "Vehicle Type is required" };
  if (!data.material?.trim()) return { error: "Material is required" };
  if (data.grossWeight == null || data.grossWeight < 0) return { error: "Gross Weight must be a positive number" };
  if (data.tareWeight == null || data.tareWeight < 0) return { error: "Tare Weight must be a positive number" };
  if (data.grossWeight <= data.tareWeight) return { error: "Gross Weight must be greater than Tare Weight" };

  const company = await Company.findById(data.company);
  if (!company) return { error: "Invalid company" };

  const calc = computeAll({
    grossWeight: data.grossWeight,
    tareWeight: data.tareWeight,
    dustPercent: data.dustPercent,
    dustWeight: data.dustWeight,
    moisturePercent: data.moisturePercent,
    moistureWeight: data.moistureWeight,
  });

  const entry = await Entry.create({
    company: data.company,
    printedSlipNo: data.printedSlipNo.trim(),
    date: new Date(data.date),
    driverName: data.driverName.trim(),
    driverContact: data.driverContact?.trim() || "",
    vehicleType: data.vehicleType.trim(),
    material: data.material.trim(),
    grossWeight: data.grossWeight,
    tareWeight: data.tareWeight,
    netWeight: calc.netWeight,
    dustPercent: calc.dustPercent,
    dustWeight: calc.dustWeight,
    moisturePercent: calc.moisturePercent,
    moistureWeight: calc.moistureWeight,
    finalWeight: calc.finalWeight,
    operator: session.user.id,
  });

  return { success: true, entryId: entry._id.toString() };
}
