import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Деактивируем Spotify service
    await prisma.musicService.updateMany({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY'
      },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiry: null
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting Spotify:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect Spotify' },
      { status: 500 }
    );
  }
}