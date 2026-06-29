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
  vendorName: string;
  vehicleNumber: string;
  driverName: string;
  driverContact: string;
  vehicleType: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  dustWeight: number | null;
  moistureWeight: number | null;
  dustExcluded: boolean;
  moistureExcluded: boolean;
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
    dustWeight: data.dustWeight,
    moistureWeight: data.moistureWeight,
    dustExcluded: data.dustExcluded,
    moistureExcluded: data.moistureExcluded,
  });

  const entry = await Entry.create({
    company: data.company,
    printedSlipNo: data.printedSlipNo.trim(),
    date: new Date(data.date),
    vendorName: data.vendorName?.trim() || "",
    vehicleNumber: data.vehicleNumber?.trim() || "",
    driverName: data.driverName?.trim() || "",
    driverContact: data.driverContact?.trim() || "",
    vehicleType: data.vehicleType.trim(),
    material: data.material.trim(),
    grossWeight: data.grossWeight,
    tareWeight: data.tareWeight,
    netWeight: calc.netWeight,
    dustWeight: calc.dustWeight,
    dustPercent: calc.dustPercent,
    moistureWeight: calc.moistureWeight,
    moisturePercent: calc.moisturePercent,
    dustExcluded: calc.dustExcluded,
    moistureExcluded: calc.moistureExcluded,
    deduction: calc.deduction,
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
  vendorName?: string;
  vehicleNumber?: string;
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
  if (query.vendorName) {
    filter.vendorName = { $regex: query.vendorName, $options: "i" };
  }
  if (query.vehicleNumber) {
    filter.vehicleNumber = { $regex: query.vehicleNumber, $options: "i" };
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
      .populate("operator", "username")
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
      vendorName: e.vendorName,
      vehicleNumber: e.vehicleNumber,
      driverName: e.driverName,
      driverContact: e.driverContact,
      vehicleType: e.vehicleType,
      material: e.material,
      grossWeight: e.grossWeight,
      tareWeight: e.tareWeight,
      netWeight: e.netWeight,
      dustWeight: e.dustWeight,
      dustPercent: e.dustPercent,
      moistureWeight: e.moistureWeight,
      moisturePercent: e.moisturePercent,
      dustExcluded: e.dustExcluded,
      moistureExcluded: e.moistureExcluded,
      deduction: e.deduction,
      finalWeight: e.finalWeight,
      operator: {
        _id: (e.operator as unknown as { _id: unknown; username: string })._id!.toString(),
        username: (e.operator as unknown as { _id: unknown; username: string }).username,
      },
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
  const entry = await Entry.findById(id)
    .populate("company", "name address phone")
    .populate("operator", "username")
    .lean();
  if (!entry) return null;

  return {
    _id: entry._id.toString(),
    company: {
      _id: (entry.company as unknown as { _id: unknown; name: string })._id!.toString(),
      name: (entry.company as unknown as { _id: unknown; name: string })?.name,
    },
    printedSlipNo: entry.printedSlipNo,
    internalId: entry.internalId,
    date: (entry.date as Date).toISOString().split("T")[0],
    vendorName: entry.vendorName,
    vehicleNumber: entry.vehicleNumber,
    driverName: entry.driverName,
    driverContact: entry.driverContact,
    vehicleType: entry.vehicleType,
    material: entry.material,
    grossWeight: entry.grossWeight,
    tareWeight: entry.tareWeight,
    netWeight: entry.netWeight,
    dustWeight: entry.dustWeight,
    dustPercent: entry.dustPercent,
    moistureWeight: entry.moistureWeight,
    moisturePercent: entry.moisturePercent,
    dustExcluded: entry.dustExcluded,
    moistureExcluded: entry.moistureExcluded,
    deduction: entry.deduction,
    finalWeight: entry.finalWeight,
    operator: {
      _id: (entry.operator as unknown as { _id: unknown; username: string })._id!.toString(),
      username: (entry.operator as unknown as { _id: unknown; username: string }).username,
    },
  };
}

export async function updateEntry(id: string, data: EntryFormData) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  const existing = await Entry.findById(id);
  if (!existing) return { error: "Entry not found" };

  if (session.user.role !== "admin" && existing.operator.toString() !== session.user.id) {
    return { error: "You can only edit your own entries" };
  }

  if (!data.company) return { error: "Company is required" };
  if (!data.printedSlipNo?.trim()) return { error: "Printed Slip No is required" };
  if (!data.date) return { error: "Date is required" };
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
    dustWeight: data.dustWeight,
    moistureWeight: data.moistureWeight,
    dustExcluded: data.dustExcluded,
    moistureExcluded: data.moistureExcluded,
  });

  await Entry.findByIdAndUpdate(id, {
    company: data.company,
    printedSlipNo: data.printedSlipNo.trim(),
    date: new Date(data.date),
    vendorName: data.vendorName?.trim() || "",
    vehicleNumber: data.vehicleNumber?.trim() || "",
    driverName: data.driverName?.trim() || "",
    driverContact: data.driverContact?.trim() || "",
    vehicleType: data.vehicleType.trim(),
    material: data.material.trim(),
    grossWeight: data.grossWeight,
    tareWeight: data.tareWeight,
    netWeight: calc.netWeight,
    dustWeight: calc.dustWeight,
    dustPercent: calc.dustPercent,
    moistureWeight: calc.moistureWeight,
    moisturePercent: calc.moisturePercent,
    dustExcluded: calc.dustExcluded,
    moistureExcluded: calc.moistureExcluded,
    deduction: calc.deduction,
    finalWeight: calc.finalWeight,
  });

  return { success: true };
}
