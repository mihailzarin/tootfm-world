import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Проверяем музыкальные сервисы если есть сессия
    let musicServices = null;
    if (session?.user?.id) {
      try {
        musicServices = await prisma.musicService.findMany({
          where: { userId: session.user.id },
          select: {
            service: true,
            isActive: true,
            spotifyId: true,
            lastSynced: true,
            tokenExpiry: true
          }
        });
      } catch (dbError) {
        console.error('DB Error:', dbError);
      }
    }
    
    return NextResponse.json({
      debug: true,
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        userId: session?.user?.id,
        email: session?.user?.email
      },
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_env: process.env.VERCEL_ENV
      },
      spotify_config: {
        client_id_exists: !!process.env.SPOTIFY_CLIENT_ID,
        client_secret_exists: !!process.env.SPOTIFY_CLIENT_SECRET,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'NOT_SET',
        public_client_id_exists: !!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        public_redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'NOT_SET'
      },
      database: {
        connected: !!prisma,
        music_services: musicServices
      },
      urls: {
        expected_callback: 'https://tootfm.world/api/spotify/callback',
        current_url: process.env.NEXTAUTH_URL || 'NOT_SET'
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}