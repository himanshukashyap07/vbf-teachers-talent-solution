import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import LinkedInProvider from "next-auth/providers/linkedin";
import bcrypt from "bcryptjs";
import { connectDB } from "./db";
import { User } from "@/models/User";
import { loginSchema } from "./validations/auth";
import { parseIdentifier } from "./validations/common";
import { isAdminUser } from "./roles";
import { clientIp, isRateLimited, recordHit, resetRateLimit } from "./rate-limit";

export const googleConfigured = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);
export const linkedinConfigured = Boolean(
  process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET,
);

// Used to keep response time similar whether or not the account exists.
export const BCRYPT_ROUNDS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
/** How often an existing session is re-checked against the database for revocation. */
const SESSION_RECHECK_MS = Number(process.env.SESSION_RECHECK_SECONDS ?? 60) * 1000;
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email or mobile",
    credentials: {
      identifier: { label: "Email or mobile number", type: "text" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw, req) {
      const parsed = loginSchema.safeParse(raw);
      if (!parsed.success) throw new Error("Enter a valid email/mobile number and password.");

      const id = parseIdentifier(parsed.data.identifier)!;

      // Brute-force protection. Keyed on the ACCOUNT (so rotating IPs does not help an attacker) and,
      // separately, on the client IP (so one machine cannot spray many accounts). 10 failures per account /
      // 100 per IP per 15 minutes.
      const idKey = `login-id:${id.value}`;
      const ipKey = `login-ip:${clientIp({ headers: (req?.headers ?? {}) as Record<string, string> })}`;
      if (isRateLimited(idKey, 10, LOGIN_WINDOW_MS) || isRateLimited(ipKey, 100, LOGIN_WINDOW_MS)) {
        throw new Error("Too many login attempts. Please wait 15 minutes or reset your password.");
      }
      await connectDB();
      const user = await User.findOne(id.type === "email" ? { email: id.value } : { phone: id.value })
        .select("+passwordHash")
        .lean();

      // Always run a bcrypt compare so timing doesn't reveal whether the account exists.
      const hash = user?.passwordHash ?? DUMMY_HASH;
      const valid = await bcrypt.compare(parsed.data.password, hash);

      if (!user || !valid) {
        // Only FAILURES count: many students/teachers share one mobile-carrier or campus IP, so counting
        // successful logins would lock honest users out.
        recordHit(idKey);
        recordHit(ipKey);
        throw new Error("Incorrect email/mobile number or password.");
      }
      resetRateLimit(idKey); // a correct login clears the failure streak

      return {
        id: String(user._id),
        name: user.name,
        email: user.email ?? null,
        image: user.image ?? null,
      };
    },
  }),
];

if (googleConfigured) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

if (linkedinConfigured) {
  // "Sign In with LinkedIn using OpenID Connect"
  providers.push(
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      issuer: "https://www.linkedin.com/oauth",
      jwks_endpoint: "https://www.linkedin.com/oauth/openid/jwks",
      authorization: { params: { scope: "openid profile email" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
        };
      },
    }),
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  pages: { signIn: "/login", error: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    /**
     * OAuth first-time users are saved to the DB here (profileComplete=false) and
     * sent to /onboarding to pick a role and fill the same details as the signup form.
     * Returning OAuth users are matched by email.
     */
    async signIn({ user, account }) {
      if (!account || account.provider === "credentials") return true;
      if (!user.email) return "/login?error=NoEmail";

      await connectDB();
      const email = user.email.toLowerCase();
      const existing = await User.findOne({ email }).select("+passwordHash");
      if (!existing) {
        await User.create({
          name: user.name || email.split("@")[0],
          email,
          image: user.image ?? undefined,
          providers: [account.provider],
          emailVerified: true, // Google/LinkedIn have already verified this address
          profileComplete: false,
        });
      } else if (!existing.emailVerified && existing.passwordHash) {
        // Pre-hijack protection: someone may have registered this address with a password
        // BEFORE its real owner signed in with Google/LinkedIn. The provider has now proven who
        // owns the address, so the attacker's password is discarded; the owner can set a new one
        // through "Forgot password".
        await User.updateOne(
          { _id: existing._id },
          {
            $unset: { passwordHash: "" },
            $set: { emailVerified: true, providers: [account.provider], ...(user.image && !existing.image ? { image: user.image } : {}) },
          },
        );
      } else {
        const update: Record<string, unknown> = {
          $addToSet: { providers: account.provider },
          $set: { emailVerified: true, ...(user.image && !existing.image ? { image: user.image } : {}) },
        };
        await User.updateOne({ _id: existing._id }, update);
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Refresh role/profile flags from the DB at sign-in, and whenever the client calls update().
      if (!token.revoked && (user || trigger === "update" || !token.uid)) {
        try {
          await connectDB();
          const email = (user?.email ?? token.email)?.toLowerCase();
          const dbUser = user?.id && !email ? await User.findById(user.id) : await User.findOne({ email });
          if (dbUser) {
            token.uid = String(dbUser._id);
            token.role = isAdminUser(dbUser) ? "admin" : (dbUser.role ?? null);
            token.profileComplete = dbUser.profileComplete;
            if (user) {
              // Only a real sign-in stamps the session version. An update() call must never revive a revoked session.
              token.sv = dbUser.sessionVersion ?? 0;
              token.svCheckedAt = Date.now();
              token.revoked = false;
            }
          }
        } catch (err) {
          console.error("[auth] jwt refresh failed", err);
        }
      }
      // Session revocation: if the password was reset (sessionVersion bumped) or the account was deleted,
      // every older JWT stops working within SESSION_RECHECK_MS.
      if (!user && token.uid && !token.revoked && Date.now() - (token.svCheckedAt ?? 0) >= SESSION_RECHECK_MS) {
        try {
          await connectDB();
          const current = await User.findById(token.uid).select("sessionVersion").lean();
          if (!current || (current.sessionVersion ?? 0) !== (token.sv ?? 0)) token.revoked = true;
          else token.svCheckedAt = Date.now();
        } catch (err) {
          console.error("[auth] session recheck failed", err); // fail open on DB hiccups; retry next call
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.revoked) return { expires: session.expires } as typeof session; // no user => treated as logged out
      if (session.user) {
        session.user.id = token.uid as string;
        session.user.role = (token.role as "candidate" | "school" | "admin" | null) ?? null;
        session.user.profileComplete = Boolean(token.profileComplete);
      }
      return session;
    },
  },
};
