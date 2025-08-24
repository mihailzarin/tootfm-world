import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

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
      }
    })
  ],
  
  callbacks: {
    async session({ session, user }) {
      // Добавляем user.id в сессию
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
    
    async signIn({ user, account, profile }) {
      // Логируем для отладки
      console.log('🔐 Google SignIn:', {
        email: user.email,
        provider: account?.provider,
        id: account?.providerAccountId
      });
      
      // Обновляем googleId если нужно
      if (user.email && account?.provider === 'google') {
        try {
          await prisma.user.update({
            where: { email: user.email },
            data: { 
              googleId: account.providerAccountId,
              verified: true 
            }
          });
        } catch (error) {
          // Пользователь ещё не создан, это нормально
        }
      }
      
      return true;
    }
  },
  
  events: {
    async signIn({ user, account }) {
      console.log('✅ User signed in:', user.email);
    },
    async signOut({ session }) {
      console.log('👋 User signed out');
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === 'development',
};