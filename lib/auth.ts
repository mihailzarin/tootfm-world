import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('SignIn attempt:', user?.email);
      
      // Просто разрешаем вход всем пользователям Google
      if (user?.email) {
        try {
          // Создаём или обновляем пользователя
          const dbUser = await prisma.user.upsert({
            where: { email: user.email },
            create: {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
              googleId: account?.providerAccountId || null,
            },
            update: {
              name: user.name || '',
              image: user.image || null,
              lastLogin: new Date(),
            }
          });
          
          console.log('User upserted:', dbUser.id);
        } catch (error) {
          console.error('Error with user upsert:', error);
          // Но всё равно разрешаем вход
        }
      }
      
      return true; // ВСЕГДА разрешаем вход
    },
    
    async jwt({ token, user }: any) {
      if (user?.email) {
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Пробуем получить userId из БД
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          if (dbUser) {
            token.userId = dbUser.id;
          }
        } catch (error) {
          console.error('Error getting userId:', error);
        }
      }
      return token;
    },
    
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.userId || token.sub || '';
        session.user.email = token.email || '';
        session.user.name = token.name || '';
        session.user.image = token.image || '';
      }
      return session;
    },
    
    async redirect({ url, baseUrl }: any) {
      // После входа всегда на профиль
      if (url === '/login' || url === baseUrl) {
        return `${baseUrl}/profile`;
      }
      return url;
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
  debug: false, // Отключаем debug в продакшене
};