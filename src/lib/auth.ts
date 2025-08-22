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
      
      if (!user?.email) {
        return false;
      }
      
      try {
        if (account?.provider === 'spotify' && account.access_token) {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email }
          });
          
          if (dbUser) {
            await prisma.musicService.upsert({
              where: {
                userId_service: {
                  userId: dbUser.id,
                  service: 'SPOTIFY'
                }
              },
              update: {
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                spotifyId: account.providerAccountId,
                isActive: true,
                lastSynced: new Date()
              },
              create: {
                userId: dbUser.id,
                service: 'SPOTIFY',
                accessToken: account.access_token,
                refreshToken: account.refresh_token,
                tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                spotifyId: account.providerAccountId,
                isActive: true
              }
            });
            console.log('[NextAuth] Spotify tokens saved');
          }
        }
      } catch (error) {
        console.error('[NextAuth] Error in signIn callback:', error);
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
              accounts: {
                select: { provider: true }
              },
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
              google: dbUser.accounts.some(a => a.provider === 'google'),
              spotify: dbUser.musicServices.some(s => s.service === 'SPOTIFY' && s.isActive),
              lastfm: dbUser.musicServices.some(s => s.service === 'LASTFM' && s.isActive),
              apple: dbUser.musicServices.some(s => s.service === 'APPLE' && s.isActive),
            };
            
            (session.user as any).spotifyId = dbUser.spotifyId;
            (session.user as any).googleId = dbUser.googleId;
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
  
  debug: process.env.NODE_ENV === 'development',
  
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