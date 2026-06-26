import mongoose, { Schema, Document } from "mongoose";

export interface ICompany extends Document {
  name: string;
  address: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Company =
  (mongoose.models.Company as mongoose.Model<ICompany>) ??
  mongoose.model<ICompany>("Company", CompanySchema);
