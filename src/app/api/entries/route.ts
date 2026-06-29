import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Entry } from "@/models/Entry";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idsParam = req.nextUrl.searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsParam.split(",").filter(Boolean);
  if (ids.length === 0) {
    return NextResponse.json({ error: "No valid IDs" }, { status: 400 });
  }

  await connectDB();

  const entries = await Entry.find({ _id: { $in: ids } })
    .populate("company", "name address phone")
    .sort({ date: -1 })
    .lean();

  return NextResponse.json(
    entries.map((e) => {
      const company = e.company as unknown as {
        _id: unknown;
        name: string;
        address: string;
        phone: string;
      };
      return {
        _id: e._id.toString(),
        company: {
          name: company.name,
          address: company.address,
          phone: company.phone,
        },
        printedSlipNo: e.printedSlipNo,
        date: (e.date as Date).toISOString(),
        vendorName: e.vendorName ?? "",
        vehicleNumber: e.vehicleNumber ?? "",
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
        dustExcluded: e.dustExcluded ?? false,
        moistureExcluded: e.moistureExcluded ?? false,
        deduction: e.deduction ?? 0,
        finalWeight: e.finalWeight,
      };
    })
  );
}
