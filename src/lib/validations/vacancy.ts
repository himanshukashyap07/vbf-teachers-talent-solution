import { z } from "zod";
import { gradeLevels, qualifications, upDistricts } from "@/config/site";

export const vacancySchema = z
  .object({
    title: z.string().trim().min(3, "Give the position a title").max(100),
    subject: z.string().trim().min(2, "Enter the subject").max(80),
    gradeLevel: z.enum(gradeLevels, { error: "Select the level" }),
    qualification: z.enum(qualifications, { error: "Select the minimum qualification" }),
    minExperienceYears: z
      .number({ error: "Enter minimum experience (0 if none)" })
      .min(0)
      .max(40),
    salaryMin: z.number({ error: "Enter the minimum monthly salary" }).min(0).max(500000),
    salaryMax: z.number({ error: "Enter the maximum monthly salary" }).min(0).max(500000),
    salaryBasis: z.enum(["gross", "take-home"], { error: "Choose gross or take-home" }),
    employmentType: z.enum(["full-time", "part-time"], { error: "Select employment type" }),
    district: z.enum(upDistricts, { error: "Select a district" }),
    joiningDate: z.string().optional(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.salaryMax >= d.salaryMin, {
    path: ["salaryMax"],
    message: "Maximum must be at least the minimum",
  });
export type VacancyInput = z.input<typeof vacancySchema>;
