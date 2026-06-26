import mongoose, { Schema, InferSchemaType } from "mongoose";

const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export type ICounter = InferSchemaType<typeof CounterSchema> & { _id: string };

export const Counter =
  (mongoose.models.Counter as mongoose.Model<ICounter>) ??
  mongoose.model<ICounter>("Counter", CounterSchema);
