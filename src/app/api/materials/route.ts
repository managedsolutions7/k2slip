import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Material } from "@/models/Material";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectDB();
  const materials = await Material.find().sort({ name: 1 }).lean();
  return NextResponse.json(materials.map((m) => ({ _id: m._id.toString(), name: m.name })));
}
