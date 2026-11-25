import { create } from "zustand";
import type { AccountStepInput, Role } from "@/lib/validations/auth";

/**
 * Holds the in-progress signup between step 1 (account) and step 2 (role details).
 * Deliberately NOT persisted: the password must never touch localStorage/sessionStorage.
 */
interface SignupState {
  step: 1 | 2;
  account: Partial<AccountStepInput>;
  role: Role | null;
  /** Set when the server rejects something that belongs to step 1 (e.g. a disposable email). */
  serverError: string | null;
  setAccount: (account: AccountStepInput) => void;
  /** Return to step 1, optionally showing why. */
  goBack: (serverError?: string) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  account: {},
  role: null,
  serverError: null,
  setAccount: (account) => set({ account, role: account.role, step: 2, serverError: null }),
  goBack: (serverError) => set({ step: 1, serverError: serverError ?? null }),
  reset: () => set({ step: 1, account: {}, role: null, serverError: null }),
}));
