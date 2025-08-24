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
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('SignIn attempt:', user?.email);
      
      // Создаем или обновляем пользователя в БД
      if (account?.provider === 'google') {
        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
              googleId: account.providerAccountId,
            }
          });
          return true;
        } catch (error) {
          console.error('Error saving user:', error);
          return false;
        }
      }
      return true;
    },
    
    async jwt({ token, user, account }: any) {
      // При первом входе добавляем ID из БД
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email }
        });
        token.id = dbUser?.id || user.id;
        token.email = user.email;
      }
      return token;
    },
    
    async session({ session, token }: any) {
      // Добавляем ID пользователя в сессию
      if (session?.user) {
        session.user.id = token.id || token.sub || '';
        session.user.email = token.email || '';
      }
      return session;
    },
    
    async redirect({ url, baseUrl }: any) {
      return `${baseUrl}/profile`;
    }
  },
  
  pages: {
    signIn: '/login',
    error: '/login',
  },
  
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 дней
  },
  
  secret: process.env.NEXTAUTH_SECRET!,
  debug: process.env.NODE_ENV === 'development',
};