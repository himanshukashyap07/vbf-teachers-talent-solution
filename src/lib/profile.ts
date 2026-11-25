import type { z } from "zod";
import { siteConfig } from "@/config/site";
import type { candidateDetailsSchema, schoolDetailsSchema } from "./validations/auth";

type RoleDetails =
  | { role: "candidate"; details: z.infer<typeof candidateDetailsSchema> }
  | { role: "school"; details: z.infer<typeof schoolDetailsSchema> };

/** Maps validated role details to the User document shape (consent timestamps included). */
export function buildProfile(input: RoleDetails) {
  const now = new Date();

  if (input.role === "candidate") {
    const d = input.details;
    return {
      candidateProfile: {
        qualification: d.qualification,
        subjects: d.subjects
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        gradeLevel: d.gradeLevel,
        experienceYears: d.experienceYears,
        district: d.district,
        expectedSalary: d.expectedSalary,
        sharingConsent: d.sharingConsent,
        sharingConsentAt: now,
        privacyVersion: siteConfig.privacyVersion,
      },
    };
  }

  const d = input.details;
  return {
    schoolProfile: {
      schoolName: d.schoolName,
      board: d.board,
      district: d.district,
      designation: d.designation,
      expectedHires: d.expectedHires,
      termsAcceptedAt: now,
      privacyVersion: siteConfig.privacyVersion,
    },
  };
}
