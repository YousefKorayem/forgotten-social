import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import authConfig from "@/auth.config";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const OAUTH_USERNAME_MAX_ATTEMPTS = 5;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;

function randomUsernameSuffix(length = 4) {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from({ length }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

function sanitizeEmailLocalPartToUsername(localPart: string) {
  const cleaned = localPart.toLowerCase().replaceAll(/[^a-z0-9_]/g, "");
  if (cleaned.length >= USERNAME_MIN_LENGTH) {
    return cleaned.slice(0, USERNAME_MAX_LENGTH);
  }

  const fallback = `${cleaned}user`;
  if (fallback.length >= USERNAME_MIN_LENGTH) {
    return fallback.slice(0, USERNAME_MAX_LENGTH);
  }

  return "user";
}

async function findOrCreateOAuthUser(params: {
  email: string;
  name: string;
  image: string | null;
}) {
  const { email, name, image } = params;

  const existingByEmail = await User.findOne({ email })
    .select("_id username email name image")
    .exec();
  if (existingByEmail) return existingByEmail;

  const localPart = email.split("@")[0] ?? "user";
  const baseUsername = sanitizeEmailLocalPartToUsername(localPart);

  for (let attempt = 0; attempt < OAUTH_USERNAME_MAX_ATTEMPTS; attempt += 1) {
    /**
     * Username policy for OAuth provisioning:
     * 1) first try sanitized email local-part
     * 2) if taken, append "_xxxx" random suffix and retry
     * 3) stop after bounded retries to avoid unbounded loops under collisions
     */
    const username =
      attempt === 0
        ? baseUsername
        : `${baseUsername.slice(0, USERNAME_MAX_LENGTH - 5)}_${randomUsernameSuffix(4)}`;

    try {
      return await User.create({
        email,
        name,
        image: image ?? undefined,
        username,
      });
    } catch (error) {
      const isDuplicate =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code?: number }).code === 11000;

      if (!isDuplicate) throw error;

      const userThatWonRace = await User.findOne({ email })
        .select("_id username email name image")
        .exec();
      if (userThatWonRace) return userThatWonRace;
    }
  }

  throw new Error("Unable to allocate a unique username for OAuth sign-in");
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        await dbConnect();

        const user = await User.findOne({ email: email.toLowerCase() })
          .select("+passwordHash")
          .exec();

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image ?? null,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (account?.provider === "credentials") return true;

      let profileEmail = "";
      if (typeof profile?.email === "string") {
        profileEmail = profile.email.toLowerCase().trim();
      } else if (typeof user.email === "string") {
        profileEmail = user.email.toLowerCase().trim();
      }

      if (!profileEmail) {
        return "/sign-in?error=oauth_email_missing";
      }

      let profileName = "Forgotten User";
      if (typeof profile?.name === "string" && profile.name.trim().length > 0) {
        profileName = profile.name.trim();
      } else if (typeof user.name === "string" && user.name.trim().length > 0) {
        profileName = user.name.trim();
      }

      await dbConnect();
      const dbUser = await findOrCreateOAuthUser({
        email: profileEmail,
        name: profileName,
        image: typeof user.image === "string" ? user.image : null,
      });

      user.id = dbUser._id.toString();
      user.username = dbUser.username;
      user.email = dbUser.email;
      user.name = dbUser.name;
      user.image = dbUser.image ?? null;

      return true;
    },
  },
});
