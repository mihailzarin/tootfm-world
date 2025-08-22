import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Получаем Last.fm username из cookies
    const lastfmUsername = request.cookies.get('lastfm_username')?.value;
    
    if (!lastfmUsername) {
      return NextResponse.json({ 
        error: 'Last.fm not connected',
        tracks: [] 
      }, { status: 200 });
    }

    // ИСПРАВЛЕНО: используем findFirst вместо upsert с составным ключом
    const existingService = await prisma.musicService.findFirst({
      where: {
        userId: user.id,
        service: 'LASTFM'
      }
    });

    if (!existingService) {
      await prisma.musicService.create({
        data: {
          userId: user.id,
          service: 'LASTFM',
          lastfmUsername: lastfmUsername,
          isActive: true,
          lastSynced: new Date()
        }
      });
    } else {
      await prisma.musicService.update({
        where: { id: existingService.id },
        data: {
          lastfmUsername: lastfmUsername,
          lastSynced: new Date()
        }
      });
    }

    // Получаем треки из Last.fm API
    const apiKey = process.env.LASTFM_API_KEY;
    if (!apiKey) {
      console.error('Last.fm API key not configured');
      return NextResponse.json({ 
        error: 'Last.fm not configured',
        tracks: [] 
      });
    }

    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=50`
    );

    if (!response.ok) {
      console.error('Last.fm API error:', response.status);
      return NextResponse.json({ 
        error: 'Failed to fetch Last.fm data',
        tracks: [] 
      });
    }

    const data = await response.json();
    
    // Форматируем треки
    const tracks = data.recenttracks?.track?.map((track: any) => ({
      name: track.name,
      artist: track.artist['#text'] || track.artist.name || track.artist,
      album: track.album?.['#text'] || '',
      url: track.url,
      image: track.image?.[2]?.['#text'] || null,
      title: track.name // для совместимости
    })) || [];

    return NextResponse.json({ 
      tracks,
      username: lastfmUsername,
      success: true
    });

  } catch (error) {
    console.error('Last.fm API error:', error);
    return NextResponse.json({
      error: 'Failed to fetch Last.fm data',
      tracks: []
    });
  }
}
