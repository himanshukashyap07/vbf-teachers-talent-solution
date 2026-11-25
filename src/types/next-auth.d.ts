import type { DefaultSession } from "next-auth";

type AppRole = "candidate" | "school" | "admin" | null;

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      profileComplete: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: AppRole;
    profileComplete?: boolean;
    sv?: number;
    svCheckedAt?: number;
    revoked?: boolean;
  }
}
