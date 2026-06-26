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

export interface EntriesQuery {
  company?: string;
  dateFrom?: string;
  dateTo?: string;
  vehicleType?: string;
  driverName?: string;
  slipNo?: string;
  page?: number;
}

const PAGE_SIZE = 20;

export async function getEntries(query: EntriesQuery) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  if (query.company) filter.company = query.company;
  if (query.vehicleType) {
    filter.vehicleType = { $regex: query.vehicleType, $options: "i" };
  }
  if (query.driverName) {
    filter.driverName = { $regex: query.driverName, $options: "i" };
  }
  if (query.slipNo) {
    filter.printedSlipNo = { $regex: query.slipNo, $options: "i" };
  }
  if (query.dateFrom || query.dateTo) {
    filter.date = {};
    if (query.dateFrom) filter.date.$gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const to = new Date(query.dateTo);
      to.setHours(23, 59, 59, 999);
      filter.date.$lte = to;
    }
  }

  const page = Math.max(1, query.page ?? 1);
  const skip = (page - 1) * PAGE_SIZE;

  const [entries, total] = await Promise.all([
    Entry.find(filter)
      .populate("company", "name")
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Entry.countDocuments(filter),
  ]);

  return {
    entries: entries.map((e) => ({
      _id: e._id.toString(),
      company: {
        _id: (e.company as unknown as { _id: unknown; name: string })._id!.toString(),
        name: (e.company as unknown as { _id: unknown; name: string }).name,
      },
      printedSlipNo: e.printedSlipNo,
      internalId: e.internalId,
      date: (e.date as Date).toISOString(),
      driverName: e.driverName,
      driverContact: e.driverContact,
      vehicleType: e.vehicleType,
      material: e.material,
      grossWeight: e.grossWeight,
      tareWeight: e.tareWeight,
      netWeight: e.netWeight,
      dustPercent: e.dustPercent,
      dustWeight: e.dustWeight,
      moisturePercent: e.moisturePercent,
      moistureWeight: e.moistureWeight,
      finalWeight: e.finalWeight,
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getEntry(id: string) {
  const session = await auth();
  if (!session) return null;

  await connectDB();
  const entry = await Entry.findById(id).populate("company", "name address phone").lean();
  if (!entry) return null;

  return {
    _id: entry._id.toString(),
    company: {
      _id: (entry.company as unknown as { _id: unknown; name: string; address: string; phone: string })._id!.toString(),
      name: (entry.company as unknown as { _id: unknown; name: string })?.name,
    },
    printedSlipNo: entry.printedSlipNo,
    internalId: entry.internalId,
    date: (entry.date as Date).toISOString().split("T")[0],
    driverName: entry.driverName,
    driverContact: entry.driverContact,
    vehicleType: entry.vehicleType,
    material: entry.material,
    grossWeight: entry.grossWeight,
    tareWeight: entry.tareWeight,
    netWeight: entry.netWeight,
    dustPercent: entry.dustPercent,
    dustWeight: entry.dustWeight,
    moisturePercent: entry.moisturePercent,
    moistureWeight: entry.moistureWeight,
    finalWeight: entry.finalWeight,
  };
}

export async function updateEntry(id: string, data: EntryFormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

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

  const entry = await Entry.findByIdAndUpdate(id, {
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
  });

  if (!entry) return { error: "Entry not found" };

  return { success: true };
}
