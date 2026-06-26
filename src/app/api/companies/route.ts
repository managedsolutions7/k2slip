import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Company } from "@/models/Company";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const companies = await Company.find().sort({ name: 1 }).lean();
  return NextResponse.json(
    companies.map((c) => ({
      _id: c._id.toString(),
      name: c.name,
      address: c.address,
      phone: c.phone,
    }))
  );
}
