import mongoose, { Schema, Document } from "mongoose";

export interface IVehicleType extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const VehicleTypeSchema = new Schema<IVehicleType>(
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

export const VehicleType =
  (mongoose.models.VehicleType as mongoose.Model<IVehicleType>) ??
  mongoose.model<IVehicleType>("VehicleType", VehicleTypeSchema);
