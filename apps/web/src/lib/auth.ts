import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import { verifyCredentials } from "../server/services/authService";
import { prisma } from "../server/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const user = await verifyCredentials(credentials.email, credentials.password);
          return { id: user.id, email: user.email, sessionVersion: user.sessionVersion };
        } catch {
          return null;
        }
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ""
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || ""
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        if (!user.email) return false;
        const existingUser = await prisma.user.findUnique({ where: { email: user.email } });
        
        if (!existingUser) {
          // Auto-register OAuth users
          await prisma.user.create({
            data: {
              email: user.email,
              authProvider: account.provider,
              emailVerifiedAt: new Date(), // OAuth is trusted
            }
          });
        } else {
          // Prevent blind overwrites & secure account linking
          if (existingUser.authProvider !== account.provider) {
             return `/auth/login?error=OAuthAccountNotLinked`;
          }
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // Initial sign in
      if (account && user) {
        if (account.provider === 'credentials') {
          token.id = user.id;
          token.sessionVersion = (user as any).sessionVersion;
        } else if (account.provider === 'google' || account.provider === 'github') {
          if (user.email) {
            const dbUser = await prisma.user.findUnique({ where: { email: user.email }});
            if (dbUser) {
              token.id = dbUser.id;
              token.sessionVersion = dbUser.sessionVersion;
            }
          }
        }
      }
      
      // Enforce the generation timestamp/counter during server-side authentication
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { sessionVersion: true }
        });
        
        if (!dbUser || dbUser.sessionVersion !== token.sessionVersion) {
          // Invalidate token by clearing it
          return { ...token, exp: 0 }; 
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.id && token.exp !== 0) {
        session.user = {
          ...session.user,
          id: token.id as string,
        } as any;
      } else {
        // Force session to expire if token was invalidated
        session.expires = new Date(0).toISOString();
      }
      return session;
    }
  }
};
