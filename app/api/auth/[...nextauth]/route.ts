import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "missing-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "missing-google-client-secret",
      authorization: {
        params: {
          scope: "openid email profile"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log("🔐 SignIn callback triggered:", { 
        provider: account?.provider, 
        email: user.email,
        hasGoogleId: !!account?.providerAccountId 
      });

      try {
        if (account?.provider === "google") {
          console.log("📝 Creating/updating user in database...");
          
          // Create or update user in database
          const dbUser = await prisma.user.upsert({
            where: { email: user.email! },
            update: { 
              name: user.name, 
              image: user.image,
              updatedAt: new Date()
            },
            create: {
              email: user.email!,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId
            }
          });

          console.log("✅ User successfully created/updated:", { 
            id: dbUser.id, 
            email: dbUser.email,
            googleId: dbUser.googleId 
          });
        }
        return true;
      } catch (error) {
        console.error("❌ Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, user, token }) {
      console.log("🔄 Session callback triggered:", { 
        hasUser: !!user, 
        hasToken: !!token,
        sessionUserId: session.user?.id 
      });

      try {
        if (session.user) {
          // Use token.userId if available (JWT strategy), otherwise user.id
          session.user.id = token.userId || user?.id;
        }
        return session;
      } catch (error) {
        console.error("❌ Error in session callback:", error);
        return session;
      }
    },
    async jwt({ token, user, account }) {
      console.log("🎫 JWT callback triggered:", { 
        hasUser: !!user, 
        hasAccount: !!account,
        tokenUserId: token.userId 
      });

      try {
        if (account && user) {
          token.userId = user.id;
        }
        return token;
      } catch (error) {
        console.error("❌ Error in JWT callback:", error);
        return token;
      }
    }
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  session: {
    strategy: "jwt"
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, ...message) {
      console.error("❌ NextAuth Error:", code, ...message);
    },
    warn(code, ...message) {
      console.warn("⚠️ NextAuth Warning:", code, ...message);
    },
    debug(code, ...message) {
      console.log("🐛 NextAuth Debug:", code, ...message);
    }
  }
});

// Runtime environment validation (only in development)
if (process.env.NODE_ENV === 'development') {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value === "your-google-client-id" || value === "your-nextauth-secret-key-here")
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    console.error("❌ Missing or invalid environment variables:", missingEnvVars);
    console.error("Please set the following environment variables:");
    missingEnvVars.forEach(key => console.error(`  - ${key}`));
  }
}

export { handler as GET, handler as POST };