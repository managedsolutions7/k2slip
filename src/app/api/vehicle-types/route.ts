import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { VehicleType } from "@/models/VehicleType";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const types = await VehicleType.find().sort({ name: 1 }).lean();
  return NextResponse.json(types.map((t) => ({ _id: t._id.toString(), name: t.name })));
}
