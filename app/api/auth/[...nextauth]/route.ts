import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

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
      allowDangerousEmailAccountLinking: true,
    }),
    
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: {
          scope: 'user-read-email user-read-private user-top-read user-read-recently-played user-library-read playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state',
          show_dialog: false,
        }
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.display_name || profile.email,
          email: profile.email,
          image: profile.images?.[0]?.url || null,
        }
      },
      allowDangerousEmailAccountLinking: true,
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn:', { 
        provider: account?.provider,
        email: user?.email 
      });
      
      // NextAuth с PrismaAdapter сам создает пользователей и аккаунты
      // Нам нужно только сохранить токены для музыкальных сервисов
      
      if (account?.provider === 'spotify' && user?.email) {
        try {
          // Найдем пользователя который был создан адаптером
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          if (dbUser && account.access_token) {
            // Сохраняем токены Spotify в MusicService
            await prisma.musicService.upsert({
              where: {
                userId_service: {
                  userId: dbUser.id,
                  service: 'SPOTIFY'
                }
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token || null,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                spotifyId: account.providerAccountId,
                isActive: true,
                lastSynced: new Date()
              },
              create: {
                userId: dbUser.id,
                service: 'SPOTIFY',
                accessToken: account.access_token,
                refreshToken: account.refresh_token || null,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                spotifyId: account.providerAccountId,
                isActive: true
              }
            });
            console.log('[NextAuth] Spotify tokens saved for user:', dbUser.id);
          }
        } catch (error) {
          console.error('[NextAuth] Error saving Spotify tokens:', error);
          // Не блокируем вход, просто логируем ошибку
        }
      }
      
      return true;
    },
    
    async session({ session, token }) {
      if (session?.user && token.sub) {
        (session.user as any).id = token.sub;
        
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            include: {
              musicServices: {
                select: {
                  service: true,
                  isActive: true
                }
              }
            }
          });
          
          if (dbUser) {
            (session.user as any).connectedServices = {
              google: true,
              spotify: dbUser.musicServices.some(s => s.service === 'SPOTIFY' && s.isActive),
              lastfm: dbUser.musicServices.some(s => s.service === 'LASTFM' && s.isActive),
              apple: dbUser.musicServices.some(s => s.service === 'APPLE' && s.isActive),
            };
          }
        } catch (error) {
          console.error('[NextAuth] Session callback error:', error);
        }
      }
      
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/profile`;
      }
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/profile`;
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
    maxAge: 30 * 24 * 60 * 60,
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };