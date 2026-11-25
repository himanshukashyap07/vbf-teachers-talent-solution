import business from "./business.json";

/**
 * Single place for brand + business settings.
 * Agency name, address, contacts, fees and due days live in ./business.json (also used by the legal documents).
 */
export const siteConfig = {
  name: business.agency,
  tagline: "Teacher recruitment for schools in Uttar Pradesh",
  description: `${business.agency} helps schools in Uttar Pradesh find screened, suitable teachers, and helps teachers find genuine, verified vacancies.`,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: business.email,
  phoneDisplay: business.phone,
  address: business.address,
  owner: business.owner,
  registrationFeeRupees: business.registrationFeeRupees,
  placementPercent: business.placementPercent,
  paymentDueDays: business.paymentDueDays,
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
  whatsappMessage: "Hello, I would like to know more about your teacher recruitment service.",
  region: "Uttar Pradesh, India",
  /**
   * LEGAL GATE (PRD §12): candidate-paid fees stay OFF until a qualified lawyer signs off.
   * Switched on only by setting CANDIDATE_FEES_ENABLED=true in the environment.
   * Public copy reads this flag (static pages bake it in at build time, so rebuild after changing it).
   * While false, the server refuses to create or charge any payment for a teacher.
   */
  candidateFeesEnabled: process.env.CANDIDATE_FEES_ENABLED === "true",
  /** One-time teacher registration fee, in paise (₹399 from business.json). Only used when candidateFeesEnabled. */
  candidateRegistrationFeePaise: business.registrationFeeRupees * 100,
  privacyVersion: "2026-11-09-v1",
} as const;

/** Fee wording used on public pages, built from business.json so the numbers never drift apart. */
const registration = `₹${business.registrationFeeRupees.toLocaleString("en-IN")}`;
const percent = `${business.placementPercent}%`;
export const fees = {
  registration,
  percent,
  dueDays: business.paymentDueDays,
  /** One sentence, for lists. */
  teacherShort: `Registration fee ${registration} (one time, non-refundable). Then ${percent} of your first month's in-hand salary, only after you are placed and paid. Schools pay nothing.`,
  /** Fuller answer, for FAQs. */
  teacherAnswer: `Yes. You pay a one-time registration fee of ${registration} at the start, after you share your resume, for registration and resume screening. It is non-refundable. If you are placed and receive your first salary, you pay ${percent} of your first month's in-hand salary within ${business.paymentDueDays} days. If you are not placed, you pay nothing more. Schools are not charged.`,
} as const;

/** Absolute base URL used inside emails (verification / reset links). */
export const appBaseUrl = (process.env.NEXTAUTH_URL ?? siteConfig.url).replace(/\/$/, "");

export const mainNav = [
  { href: "/schools", label: "For Schools" },
  { href: "/teachers", label: "For Teachers" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
] as const;

export const upDistricts = [
  "Lucknow",
  "Kanpur Nagar",
  "Varanasi",
  "Prayagraj",
  "Agra",
  "Meerut",
  "Ghaziabad",
  "Gautam Buddh Nagar (Noida)",
  "Bareilly",
  "Aligarh",
  "Moradabad",
  "Gorakhpur",
  "Jhansi",
  "Mathura",
  "Saharanpur",
  "Firozabad",
  "Muzaffarnagar",
  "Ayodhya",
  "Azamgarh",
  "Other district in Uttar Pradesh",
  "Outside Uttar Pradesh",
] as const;

export const boards = ["CBSE", "ICSE / ISC", "UP Board", "Other / Mixed"] as const;

export const qualifications = [
  "12th Pass",
  "Graduate (B.A. / B.Sc. / B.Com.)",
  "B.Ed.",
  "D.El.Ed. / B.T.C.",
  "Post-graduate (M.A. / M.Sc. / M.Com.)",
  "M.Ed.",
  "Ph.D.",
  "Other",
] as const;

export const teacherCategories = [
  "Pre-primary (Nursery–UKG)",
  "Primary (PRT, Classes 1–5)",
  "Trained Graduate (TGT, Classes 6–10)",
  "Post-graduate (PGT, Classes 11–12)",
  "Subject specialist / coaching faculty",
] as const;

export const gradeLevels = [
  "Pre-primary (Nursery–UKG)",
  "Primary (Classes 1–5)",
  "Middle (Classes 6–8)",
  "Secondary (Classes 9–10)",
  "Senior secondary (Classes 11–12)",
] as const;
