import mongoose, { Schema, Document, Types } from "mongoose";
import { Counter } from "./Counter";

export interface IEntry extends Document {
  company: Types.ObjectId;
  printedSlipNo: string;
  internalId: number;
  date: Date;
  driverName: string;
  driverContact: string;
  vehicleType: string;
  material: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  dustPercent: number | null;
  dustWeight: number | null;
  moisturePercent: number | null;
  moistureWeight: number | null;
  finalWeight: number;
  operator: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EntrySchema = new Schema<IEntry>(
  {
    company: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    printedSlipNo: {
      type: String,
      required: true,
      trim: true,
    },
    internalId: {
      type: Number,
      unique: true,
    },
    date: {
      type: Date,
      required: true,
    },
    driverName: {
      type: String,
      required: true,
      trim: true,
    },
    driverContact: {
      type: String,
      default: "",
      trim: true,
    },
    vehicleType: {
      type: String,
      required: true,
      trim: true,
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    grossWeight: {
      type: Number,
      required: true,
    },
    tareWeight: {
      type: Number,
      required: true,
    },
    netWeight: {
      type: Number,
      required: true,
    },
    dustPercent: {
      type: Number,
      default: null,
    },
    dustWeight: {
      type: Number,
      default: null,
    },
    moisturePercent: {
      type: Number,
      default: null,
    },
    moistureWeight: {
      type: Number,
      default: null,
    },
    finalWeight: {
      type: Number,
      required: true,
    },
    operator: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

EntrySchema.pre("save", async function () {
  if (this.isNew && !this.internalId) {
    const counter = await Counter.findByIdAndUpdate(
      "entryId",
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.internalId = counter!.seq;
  }
});

export const Entry =
  (mongoose.models.Entry as mongoose.Model<IEntry>) ??
  mongoose.model<IEntry>("Entry", EntrySchema);
