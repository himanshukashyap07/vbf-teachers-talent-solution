import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const inquirySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: String,
    audience: { type: String, enum: ["school", "teacher", "other"], required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new", index: true },
  },
  { timestamps: true },
);

export const Inquiry: Model<InferSchemaType<typeof inquirySchema>> =
  (models.Inquiry as Model<InferSchemaType<typeof inquirySchema>>) ||
  model("Inquiry", inquirySchema);
