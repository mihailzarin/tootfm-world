import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// ВАЖНО: Экспортируем authOptions для использования в других местах
export const authOptions: NextAuthOptions = {
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
      },
      // РАЗРЕШАЕМ связывание аккаунтов с одинаковым email
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback started');
      console.log('[NextAuth] User email:', user?.email);
      console.log('[NextAuth] Provider:', account?.provider);
      console.log('[NextAuth] Provider Account ID:', account?.providerAccountId);
      
      if (!user?.email) {
        console.error('[NextAuth] No email found');
        return false;
      }
      
      try {
        // Проверяем существует ли пользователь с таким email
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true }
        });
        
        if (existingUser) {
          console.log('[NextAuth] User exists with ID:', existingUser.id);
          
          // Проверяем есть ли уже Google аккаунт
          const hasGoogleAccount = existingUser.accounts.some(
            acc => acc.provider === 'google'
          );
          
          if (!hasGoogleAccount) {
            console.log('[NextAuth] Linking Google account to existing user');
            // Если нет - создаем связь с Google
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account!.type,
                provider: account!.provider,
                providerAccountId: account!.providerAccountId,
                refresh_token: account!.refresh_token,
                access_token: account!.access_token,
                expires_at: account!.expires_at,
                token_type: account!.token_type,
                scope: account!.scope,
                id_token: account!.id_token,
                session_state: account!.session_state,
              }
            });
          }
          
          // Обновляем данные пользователя
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              googleId: account?.providerAccountId || existingUser.googleId,
              emailVerified: new Date(),
            }
          });
          
          console.log('[NextAuth] User updated successfully');
          return true;
        } else {
          console.log('[NextAuth] Creating new user');
          
          // Создаем нового пользователя
          const newUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              googleId: account?.providerAccountId || null,
              emailVerified: new Date(),
              accounts: {
                create: {
                  type: account!.type,
                  provider: account!.provider,
                  providerAccountId: account!.providerAccountId,
                  refresh_token: account!.refresh_token,
                  access_token: account!.access_token,
                  expires_at: account!.expires_at,
                  token_type: account!.token_type,
                  scope: account!.scope,
                  id_token: account!.id_token,
                  session_state: account!.session_state,
                }
              }
            }
          });
          
          console.log('[NextAuth] New user created with ID:', newUser.id);
          return true;
        }
      } catch (error) {
        console.error('[NextAuth] Database error:', error);
        console.error('[NextAuth] Error details:', JSON.stringify(error, null, 2));
        return false;
      }
    },
    
    async session({ session, token }) {
      console.log('[NextAuth] Session callback');
      
      if (session?.user) {
        // Добавляем ID пользователя в сессию
        (session.user as any).id = token.sub!;
        
        // Получаем дополнительные данные из БД
        if (token.sub) {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            select: {
              id: true,
              email: true,
              name: true,
              image: true,
              googleId: true,
              worldId: true,
              verified: true,
            }
          });
          
          if (dbUser) {
            session.user = {
              ...session.user,
              id: dbUser.id,
              googleId: dbUser.googleId,
              worldId: dbUser.worldId,
              verified: dbUser.verified,
            } as any;
          }
        }
      }
      
      return session;
    },
    
    async jwt({ token, user, account }) {
      console.log('[NextAuth] JWT callback');
      
      // При первом входе
      if (account && user) {
        token.id = user.id;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      
      // Редирект после успешного входа
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // По умолчанию на профиль
      return `${baseUrl}/profile`;
    }
  },
  
  events: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] Event: User signed in:', user.email);
    },
    async signOut({ session, token }) {
      console.log('[NextAuth] Event: User signed out');
    },
    async createUser({ user }) {
      console.log('[NextAuth] Event: New user created:', user.email);
    },
    async linkAccount({ user, account, profile }) {
      console.log('[NextAuth] Event: Account linked:', account.provider, 'for user:', user.email);
    }
  },
  
  debug: true,
  
  pages: {
    signIn: '/login',
    error: '/login',
    signOut: '/',
  },
  
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  }
};

// Создаем handler с authOptions
const handler = NextAuth(authOptions);

// Runtime environment validation (only in development)
if (process.env.NODE_ENV === 'development') {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  };

  const missingEnvVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missingEnvVars.length > 0) {
    console.error("❌ Missing environment variables:", missingEnvVars);
  } else {
    console.log("✅ All NextAuth environment variables are set");
  }
}

export { handler as GET, handler as POST };