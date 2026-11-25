import business from "@/config/business.json";
import rules from "@/content/legal/rules.json";
import terms from "@/content/legal/terms.json";
import privacy from "@/content/legal/privacy.json";
import paymentPolicy from "@/content/legal/payment-policy.json";
import candidateAgreement from "@/content/legal/candidate-agreement.json";
import workingMethods from "@/content/legal/working-methods.json";

export type Bi = { en: string; hi: string };
export type BiList = { en: string[]; hi: string[] };
export type LegalBlock = { p: Bi } | { ul: BiList };
export interface LegalSection {
  h: Bi;
  blocks: LegalBlock[];
}
export interface LegalDocData {
  slug: string;
  title: Bi;
  description: Bi;
  updated: Bi;
  note: Bi;
  sections: LegalSection[];
  isAgreement?: boolean;
  signature?: {
    h: Bi;
    fields: Bi[];
    consents: Bi[];
    signNote: Bi;
    agencyNote: Bi;
  };
}

export type LegalSlug =
  | "rules"
  | "terms"
  | "privacy"
  | "payment-policy"
  | "candidate-agreement"
  | "working-methods";

const raw: Record<LegalSlug, unknown> = {
  rules,
  terms,
  privacy,
  "payment-policy": paymentPolicy,
  "candidate-agreement": candidateAgreement,
  "working-methods": workingMethods,
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** Values that replace {{tokens}} in the legal text. Everything comes from business.json. */
export function legalValues(): Record<string, string> {
  const exSalary = 20000;
  return {
    agency: business.agency,
    legalForm: business.legalForm,
    legalFormHi: "एकल स्वामित्व फर्म",
    owner: business.owner,
    address: business.address,
    email: business.email,
    phone: business.phone,
    whatsapp: business.whatsapp,
    website: business.website,
    udyam: business.udyam,
    grievanceOfficer: business.grievanceOfficer,
    grievanceContact: business.grievanceContact,
    city: business.jurisdictionCity,
    regFee: inr(business.registrationFeeRupees),
    pct: `${business.placementPercent}%`,
    dueDays: String(business.paymentDueDays),
    exSalary: inr(exSalary),
    exFee: inr(Math.round((exSalary * business.placementPercent) / 100)),
  };
}

function deepFill<T>(node: T, values: Record<string, string>): T {
  if (typeof node === "string") {
    return node.replace(/\{\{(\w+)\}\}/g, (m, key: string) => values[key] ?? m) as T;
  }
  if (Array.isArray(node)) return node.map((n) => deepFill(n, values)) as T;
  if (node && typeof node === "object") {
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, deepFill(v, values)])) as T;
  }
  return node;
}

export function getLegalDoc(slug: LegalSlug): LegalDocData {
  return deepFill(raw[slug] as LegalDocData, legalValues());
}
