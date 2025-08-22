import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback:', { 
        user: user?.email,
        provider: account?.provider,
        profile: profile?.email 
      });
      
      if (!user?.email) {
        console.error('[NextAuth] No email found');
        return false;
      }
      
      try {
        // Ensure user exists in database
        const dbUser = await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            image: user.image,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            googleId: account?.providerAccountId,
          },
        });
        
        console.log('[NextAuth] User upserted:', dbUser.id);
        return true;
      } catch (error) {
        console.error('[NextAuth] Database error:', error);
        return false;
      }
    },
    
    async session({ session, token }) {
      console.log('[NextAuth] Session callback:', { 
        hasSession: !!session,
        hasToken: !!token,
        userId: token?.sub 
      });
      
      if (token && session.user) {
        session.user.id = token.sub!;
      }
      return session;
    },
    
    async jwt({ token, user }) {
      console.log('[NextAuth] JWT callback:', { 
        hasToken: !!token,
        hasUser: !!user,
        tokenId: token?.id 
      });
      
      if (user) {
        token.id = user.id;
      }
      return token;
    }
  },
  debug: true, // Enable debug mode to see what's happening
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt"
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