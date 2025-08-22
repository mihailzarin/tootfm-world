import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию пользователя
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем токены Spotify из БД
    const musicService = await prisma.musicService.findUnique({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'SPOTIFY'
        }
      }
    });

    if (!musicService || !musicService.accessToken) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 401 });
    }

    // Проверяем не истек ли токен
    let accessToken = musicService.accessToken;
    
    if (musicService.tokenExpiry && new Date() > musicService.tokenExpiry) {
      console.log('[Spotify] Token expired, refreshing...');
      
      if (!musicService.refreshToken) {
        return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
      }

      try {
        const newTokens = await refreshSpotifyToken(musicService.refreshToken);
        
        // Обновляем токены в БД
        await prisma.musicService.update({
          where: { id: musicService.id },
          data: {
            accessToken: newTokens.access_token,
            tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000)
          }
        });
        
        accessToken = newTokens.access_token;
      } catch (error) {
        console.error('[Spotify] Token refresh failed:', error);
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
      }
    }

    // Запрашиваем данные из Spotify
    const [topTracks, topArtists] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    if (!topTracks.ok || !topArtists.ok) {
      console.error('[Spotify] API request failed');
      return NextResponse.json({ error: 'Failed to fetch Spotify data' }, { status: 500 });
    }

    const tracksData = await topTracks.json();
    const artistsData = await topArtists.json();

    // Извлекаем жанры из артистов
    const genres = artistsData.items.reduce((acc: Record<string, number>, artist: any) => {
      artist.genres?.forEach((genre: string) => {
        acc[genre] = (acc[genre] || 0) + 1;
      });
      return acc;
    }, {});

    // Сортируем жанры по популярности
    const topGenres = Object.entries(genres)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([genre]) => genre);

    return NextResponse.json({
      tracks: tracksData.items || [],
      artists: artistsData.items || [],
      genres: topGenres,
      connected: true
    });

  } catch (error) {
    console.error('[Spotify] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}