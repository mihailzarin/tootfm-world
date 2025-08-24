import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }
    
    // Пробуем сохранить тестовые данные
    console.log('Testing save for user:', session.user.id);
    
    const result = await prisma.musicService.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'SPOTIFY'
        }
      },
      update: {
        spotifyId: 'test_spotify_id',
        accessToken: 'test_token',
        refreshToken: 'test_refresh',
        tokenExpiry: new Date(Date.now() + 3600000),
        isActive: true,
        lastSynced: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'SPOTIFY',
        spotifyId: 'test_spotify_id',
        accessToken: 'test_token',
        refreshToken: 'test_refresh',
        tokenExpiry: new Date(Date.now() + 3600000),
        isActive: true
      }
    });
    
    return NextResponse.json({
      success: true,
      saved: {
        id: result.id,
        userId: result.userId,
        service: result.service,
        spotifyId: result.spotifyId
      }
    });
    
  } catch (error) {
    console.error('Test save error:', error);
    return NextResponse.json({
      error: 'Failed to save',
      details: error instanceof Error ? error.message : 'Unknown error',
      type: error?.constructor?.name
    }, { status: 500 });
  }
}