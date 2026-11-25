import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const candidateProfileSchema = new Schema(
  {
    qualification: String,
    subjects: [String],
    gradeLevel: String,
    experienceYears: Number,
    district: String,
    expectedSalary: Number,
    sharingConsent: Boolean,
    sharingConsentAt: Date,
    privacyVersion: String,
  },
  { _id: false },
);

const schoolProfileSchema = new Schema(
  {
    schoolName: String,
    board: String,
    district: String,
    designation: String,
    expectedHires: Number,
    termsAcceptedAt: Date,
    privacyVersion: String,
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    // sparse+unique: OAuth users may lack a phone; credentials users always have both.
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, select: false },
    // True once the user clicked the emailed link, or signed in via Google/LinkedIn (provider-verified).
    emailVerified: { type: Boolean, default: false },
    // Bumped on password reset; JWTs carrying an older number are rejected (see lib/auth.ts).
    sessionVersion: { type: Number, default: 0 },
    image: String,
    providers: { type: [String], default: [] }, // "credentials" | "google" | "linkedin"
    role: { type: String, enum: ["candidate", "school", "admin"] },
    profileComplete: { type: Boolean, default: false },
    candidateProfile: candidateProfileSchema,
    schoolProfile: schoolProfileSchema,
    // Agency-side pipeline status (PRD §6.2 / §6.3). Updated by staff, not by users.
    pipelineStatus: {
      type: String,
      enum: ["registered", "screened", "needs-follow-up", "submitted", "placed", "inactive"],
      default: "registered",
    },
  },
  { timestamps: true },
);

export type UserDoc = InferSchemaType<typeof userSchema> & { _id: import("mongoose").Types.ObjectId };

export const User: Model<InferSchemaType<typeof userSchema>> =
  (models.User as Model<InferSchemaType<typeof userSchema>>) || model("User", userSchema);
