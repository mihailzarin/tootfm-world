import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: NextAuthOptions = {
  // УБИРАЕМ adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }: any) {
      console.log('SignIn attempt:', user?.email);
      return true;
    },
    
    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id || token.sub;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.sub || '';
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