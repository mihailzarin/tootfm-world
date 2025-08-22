import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Проверяем сессию
    const session = await getServerSession(authOptions);
    
    // Проверяем переменные окружения (без секретов!)
    const envCheck = {
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID,
      SPOTIFY_CLIENT_SECRET: !!process.env.SPOTIFY_CLIENT_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL,
    };
    
    // Проверяем Spotify App settings
    const spotifyCheck = {
      clientId: process.env.SPOTIFY_CLIENT_ID?.substring(0, 8) + '...',
      redirectUri: `${process.env.NEXTAUTH_URL || 'https://tootfm.world'}/api/auth/callback/spotify`,
      expectedCallbackUrl: 'https://tootfm.world/api/auth/callback/spotify'
    };
    
    // Если есть сессия, проверяем БД
    let dbCheck = null;
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
          accounts: {
            select: {
              provider: true,
              providerAccountId: true,
              createdAt: true
            }
          },
          musicServices: {
            select: {
              service: true,
              isActive: true,
              lastSynced: true
            }
          }
        }
      });
      
      dbCheck = {
        userExists: !!user,
        userId: user?.id,
        accounts: user?.accounts || [],
        musicServices: user?.musicServices || []
      };
    }
    
    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null,
      envCheck,
      spotifyCheck,
      dbCheck,
      debug: {
        message: 'Use this info to debug auth issues',
        checkSpotifyApp: 'Make sure redirect URI in Spotify App matches exactly',
        currentUrl: process.env.NEXTAUTH_URL || 'https://tootfm.world'
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('[Debug] Error:', error);
    return NextResponse.json({
      status: 'error',
      error: (error as Error).message,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    }, { status: 500 });
  }
}