import mongoose, { Schema, Document } from "mongoose";

export interface IMaterial extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const MaterialSchema = new Schema<IMaterial>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Material =
  (mongoose.models.Material as mongoose.Model<IMaterial>) ??
  mongoose.model<IMaterial>("Material", MaterialSchema);
