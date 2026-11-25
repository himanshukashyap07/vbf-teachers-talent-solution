import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const vacancySchema = new Schema(
  {
    school: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolName: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    gradeLevel: { type: String, required: true },
    qualification: { type: String, required: true },
    minExperienceYears: { type: Number, default: 0 },
    salaryMin: { type: Number, required: true },
    salaryMax: { type: Number, required: true },
    salaryBasis: { type: String, enum: ["gross", "take-home"], required: true },
    employmentType: { type: String, enum: ["full-time", "part-time"], required: true },
    district: { type: String, required: true },
    joiningDate: Date,
    notes: String,
    // New vacancies wait for the agency to verify them with the school (PRD §6.1 step 4).
    status: {
      type: String,
      enum: ["pending-verification", "open", "on-hold", "filled", "closed"],
      default: "pending-verification",
      index: true,
    },
  },
  { timestamps: true },
);

export type VacancyDoc = InferSchemaType<typeof vacancySchema> & {
  _id: import("mongoose").Types.ObjectId;
  createdAt: Date;
};

export const Vacancy: Model<InferSchemaType<typeof vacancySchema>> =
  (models.Vacancy as Model<InferSchemaType<typeof vacancySchema>>) ||
  model("Vacancy", vacancySchema);
