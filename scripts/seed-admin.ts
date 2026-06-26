import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Set MONGODB_URI environment variable");
  process.exit(1);
}

const username = process.argv[2] || "admin";
const password = process.argv[3] || "admin123";

interface IUser {
  username: string;
  passwordHash: string;
  role: string;
}

async function seed() {
  await mongoose.connect(MONGODB_URI!);

  const UserSchema = new mongoose.Schema<IUser>(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      passwordHash: { type: String, required: true },
      role: { type: String, enum: ["admin", "operator"], required: true },
    },
    { timestamps: true },
  );

  const User =
    (mongoose.models.User as mongoose.Model<IUser>) ??
    mongoose.model<IUser>("User", UserSchema);

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    console.log(`User "${username}" already exists.`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({
    username: username.toLowerCase(),
    passwordHash,
    role: "admin",
  });

  console.log(`Admin account created:`);
  console.log(`  Username: ${username}`);
  console.log(`  Password: ${password}`);
  console.log(`  Change the password after first login.`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
