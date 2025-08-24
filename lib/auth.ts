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
      
      if (!user?.email) return false;
      
      try {
        // Создаём или находим пользователя в БД
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
            googleId: account?.providerAccountId || null,
          }
        });
        
        console.log('User saved to DB:', dbUser.id);
        return true;
      } catch (error) {
        console.error('Error saving user to DB:', error);
        return false;
      }
    },
    
    async jwt({ token, user, account }: any) {
      // При первом входе сохраняем email в токен
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        
        // Получаем ID из БД
        if (user.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          if (dbUser) {
            token.userId = dbUser.id;
          }
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
  debug: true,
};