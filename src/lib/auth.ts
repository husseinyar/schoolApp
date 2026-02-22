import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1, "Password is required"),
});

export const authOptions: NextAuthOptions = {
    // adapter: PrismaAdapter(prisma), // Enable if using database sessions or OAuth
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const { email, password } = await loginSchema.parseAsync(credentials);

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user || !user.passwordHash) {
                    return null;
                }

                const isValid = await bcrypt.compare(password, user.passwordHash);

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id || "",
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // After sign-in, if the callbackUrl points to /dashboard
            // (the NextAuth default), rewrite it to the role-appropriate home.
            // We can't access the session here, so we redirect to "/" which
            // itself does a role-aware redirect via the root page.tsx.
            if (url === `${baseUrl}/dashboard` || url === "/dashboard") {
                return `${baseUrl}/`;
            }
            // Allow relative URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allow same-origin absolute URLs
            if (url.startsWith(baseUrl)) return url;
            return baseUrl;
        },
    },
};
