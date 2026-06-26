import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  passwordHash: string;
  role: "admin" | "operator";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "operator"],
      required: true,
    },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ??
  mongoose.model<IUser>("User", UserSchema);
