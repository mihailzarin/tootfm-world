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
    
    console.log('Testing save for user:', session.user.id);
    
    // Проверяем существование
    const existing = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY'
      }
    });
    
    let result;
    
    if (existing) {
      // Обновляем
      result = await prisma.musicService.update({
        where: {
          id: existing.id
        },
        data: {
          spotifyId: 'test_spotify_id_updated',
          accessToken: 'test_token_updated',
          refreshToken: 'test_refresh_updated',
          tokenExpiry: new Date(Date.now() + 3600000),
          isActive: true,
          lastSynced: new Date()
        }
      });
      console.log('Updated existing record');
    } else {
      // Создаем
      result = await prisma.musicService.create({
        data: {
          userId: session.user.id,
          service: 'SPOTIFY',
          spotifyId: 'test_spotify_id',
          accessToken: 'test_token',
          refreshToken: 'test_refresh',
          tokenExpiry: new Date(Date.now() + 3600000),
          isActive: true
        }
      });
      console.log('Created new record');
    }
    
    return NextResponse.json({
      success: true,
      action: existing ? 'updated' : 'created',
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