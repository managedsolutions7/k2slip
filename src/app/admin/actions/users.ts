"use server";

import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getUsers() {
  await requireAdmin();
  await connectDB();
  const users = await User.find({}, { passwordHash: 0 })
    .sort({ createdAt: -1 })
    .lean();
  return users.map((u) => ({
    _id: u._id.toString(),
    username: u.username,
    role: u.role,
    createdAt: u.createdAt.toISOString(),
  }));
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const username = (formData.get("username") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const role = formData.get("role") as string;

  if (!username || !password || !role) {
    return { error: "All fields are required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  if (!["admin", "operator"].includes(role)) {
    return { error: "Invalid role" };
  }

  const existing = await User.findOne({ username });
  if (existing) {
    return { error: "Username already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ username, passwordHash, role: role as "admin" | "operator" });

  revalidatePath("/admin/users");
  return { success: true };
}

export async function resetPassword(formData: FormData) {
  await requireAdmin();
  await connectDB();

  const userId = formData.get("userId") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!userId || !newPassword) {
    return { error: "User ID and new password are required" };
  }
  if (newPassword.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  const user = await User.findByIdAndUpdate(userId, { passwordHash });
  if (!user) {
    return { error: "User not found" };
  }

  revalidatePath("/admin/users");
  return { success: true };
}

export async function toggleUserRole(formData: FormData) {
  const session = await requireAdmin();
  await connectDB();

  const userId = formData.get("userId") as string;
  if (!userId) return { error: "User ID is required" };

  if (userId === session.user.id) {
    return { error: "Cannot change your own role" };
  }

  const user = await User.findById(userId);
  if (!user) return { error: "User not found" };

  user.role = user.role === "admin" ? "operator" : "admin";
  await user.save();

  revalidatePath("/admin/users");
  return { success: true };
}
