import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import SpotifyProvider from "next-auth/providers/spotify";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

// ВАЖНО: Экспортируем authOptions для использования в других местах
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google Provider (уже работает)
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
    
    // Spotify Provider (НОВЫЙ)
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'user-read-email user-read-private user-top-read user-read-recently-played user-library-read playlist-read-private playlist-read-collaborative streaming user-read-playback-state user-modify-playback-state'
        }
      },
      allowDangerousEmailAccountLinking: true,
    })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('[NextAuth] SignIn callback started');
      console.log('[NextAuth] Provider:', account?.provider);
      console.log('[NextAuth] User email:', user?.email);
      
      if (!user?.email) {
        console.error('[NextAuth] No email found');
        return false;
      }
      
      try {
        // Проверяем существует ли пользователь
        let dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { accounts: true, musicServices: true }
        });
        
        if (dbUser) {
          console.log('[NextAuth] User exists with ID:', dbUser.id);
          
          // Проверяем есть ли уже аккаунт этого провайдера
          const hasProviderAccount = dbUser.accounts.some(
            acc => acc.provider === account?.provider
          );
          
          if (!hasProviderAccount && account) {
            console.log(`[NextAuth] Linking ${account.provider} account to existing user`);
            
            // Создаем запись Account для NextAuth
            await prisma.account.create({
              data: {
                userId: dbUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state: account.session_state,
              }
            });
          }
          
          // Обновляем данные пользователя
          await prisma.user.update({
            where: { id: dbUser.id },
            data: {
              name: user.name || dbUser.name,
              image: user.image || dbUser.image,
              googleId: account?.provider === 'google' ? account.providerAccountId : dbUser.googleId,
              emailVerified: new Date(),
            }
          });
          
          // НОВОЕ: Сохраняем токены музыкальных сервисов
          if (account?.provider === 'spotify' && account.access_token) {
            console.log('[NextAuth] Saving Spotify tokens to MusicService');
            
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
          }
          
        } else {
          console.log('[NextAuth] Creating new user');
          
          // Создаем нового пользователя с Account
          dbUser = await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || null,
              image: user.image || null,
              googleId: account?.provider === 'google' ? account.providerAccountId : null,
              emailVerified: new Date(),
              accounts: account ? {
                create: {
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  refresh_token: account.refresh_token,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token,
                  session_state: account.session_state,
                }
              } : undefined,
              // Если это Spotify, сразу создаем MusicService
              musicServices: account?.provider === 'spotify' && account.access_token ? {
                create: {
                  service: 'SPOTIFY',
                  accessToken: account.access_token,
                  refreshToken: account.refresh_token,
                  tokenExpiry: account.expires_at ? new Date(account.expires_at * 1000) : null,
                  spotifyId: account.providerAccountId,
                  isActive: true
                }
              } : undefined
            }
          });
          
          console.log('[NextAuth] New user created with ID:', dbUser.id);
        }
        
        return true;
      } catch (error) {
        console.error('[NextAuth] Database error:', error);
        return false;
      }
    },
    
    async session({ session, token }) {
      console.log('[NextAuth] Session callback');
      
      if (session?.user && token.sub) {
        // Добавляем ID пользователя
        (session.user as any).id = token.sub;
        
        try {
          // Получаем данные пользователя с подключенными сервисами
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub },
            include: {
              musicServices: {
                select: {
                  service: true,
                  isActive: true,
                  lastSynced: true
                }
              }
            }
          });
          
          if (dbUser) {
            // Добавляем информацию о подключенных сервисах
            (session.user as any).connectedServices = {
              google: true, // Всегда true если есть сессия
              spotify: dbUser.musicServices.some(s => s.service === 'SPOTIFY' && s.isActive),
              lastfm: dbUser.musicServices.some(s => s.service === 'LASTFM' && s.isActive),
              apple: dbUser.musicServices.some(s => s.service === 'APPLE' && s.isActive),
            };
            
            // Добавляем дополнительные поля
            (session.user as any).googleId = dbUser.googleId;
            (session.user as any).worldId = dbUser.worldId;
            (session.user as any).verified = dbUser.verified;
          }
        } catch (error) {
          console.error('[NextAuth] Error fetching user data:', error);
        }
      }
      
      return session;
    },
    
    async jwt({ token, user, account, trigger }) {
      console.log('[NextAuth] JWT callback - trigger:', trigger);
      
      // При первом входе
      if (account && user) {
        token.id = user.id;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
      }
      
      // При обновлении токена (для Spotify refresh)
      if (trigger === "update" && token.sub) {
        // Здесь можно обновить токены Spotify если нужно
        console.log('[NextAuth] Token update triggered');
      }
      
      return token;
    },
    
    async redirect({ url, baseUrl }) {
      console.log('[NextAuth] Redirect callback:', { url, baseUrl });
      
      // После успешного входа через любой провайдер
      if (url.includes('/api/auth/callback')) {
        return `${baseUrl}/profile`;
      }
      
      // Сохраняем остальные редиректы
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      return `${baseUrl}/profile`;
    }
  },
  
  events: {
    async signIn({ user, account }) {
      console.log(`[NextAuth] Event: User signed in via ${account?.provider}:`, user.email);
    },
    async signOut({ session, token }) {
      console.log('[NextAuth] Event: User signed out');
    },
    async linkAccount({ user, account }) {
      console.log(`[NextAuth] Event: ${account.provider} account linked for user:`, user.email);
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

// Runtime environment validation
if (process.env.NODE_ENV === 'development') {
  const requiredEnvVars = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID,
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET,
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