/** Comma-separated list of staff email addresses, from ADMIN_EMAILS. */
export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * A user is staff if their role is "admin", or their email is listed in ADMIN_EMAILS AND verified.
 * The verified check stops someone from signing up with a staff address they don't own.
 */
export function isAdminUser(u: { role?: string | null; email?: string | null; emailVerified?: boolean | null }) {
  if (u.role === "admin") return true;
  return Boolean(u.email && u.emailVerified && adminEmails().includes(u.email.toLowerCase()));
}
