import db from "@repo/db/client";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type ExtendedUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string;
    name?: string | null;
    email?: string | null;
    picture?: string | null;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "tonystark@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const validatedCredentials = credentialsSchema.safeParse(credentials);
          if (!validatedCredentials.success) {
            console.error("Validation error:", validatedCredentials.error);
            return null;
          }

          // Find existing user
          const existingUser = await db.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          // If user exists, validate password
          if (existingUser) {
            const passwordValid = await bcrypt.compare(
              credentials.password,
              existingUser.password
            );
            
            if (passwordValid) {
              return {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                image: existingUser.image
              };
            }
            return null;
          }

          // Don't auto-create users on login attempt - separate signup flow is better practice
          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.JWT_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Initial sign in
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.sub;
      }
      return session;
    }
  },
}