// app/api/spotify/top-items/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 401 });
    }

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        musicServices: {
          where: { service: 'SPOTIFY' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 404 });
    }

    // Проверяем Spotify сервис
    const spotifyService = user.musicServices[0];
    
    if (!spotifyService?.accessToken) {
      // Проверяем старый способ через cookies (для обратной совместимости)
      const spotifyToken = request.cookies.get('spotify_token')?.value;
      
      if (!spotifyToken) {
        console.log('❌ No Spotify token found');
        return NextResponse.json({ 
          error: 'Spotify not connected',
          tracks: { items: [] },
          artists: { items: [] }
        }, { status: 401 });
      }
      
      // Используем токен из cookie и сохраняем в БД для будущего использования
      await prisma.musicService.create({
        data: {
          userId: user.id,
          service: 'SPOTIFY',
          accessToken: spotifyToken,
          isActive: true,
          lastSynced: new Date()
        }
      }).catch(() => {
        // Если запись уже существует, обновляем её
        return prisma.musicService.update({
          where: {
            userId_service: {
              userId: user.id,
              service: 'SPOTIFY'
            }
          },
          data: {
            accessToken: spotifyToken,
            isActive: true,
            lastSynced: new Date()
          }
        });
      });
      
      return fetchSpotifyData(spotifyToken);
    }

    // Проверяем не истек ли токен
    if (spotifyService.tokenExpiry && new Date(spotifyService.tokenExpiry) < new Date()) {
      console.log('⚠️ Spotify token expired, need to refresh');
      // TODO: Implement token refresh
      return NextResponse.json({ 
        error: 'Spotify token expired',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 401 });
    }

    // Используем токен из БД
    return fetchSpotifyData(spotifyService.accessToken);

  } catch (error) {
    console.error('❌ Error in Spotify API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      tracks: { items: [] },
      artists: { items: [] }
    }, { status: 500 });
  }
}

async function fetchSpotifyData(spotifyToken: string) {
  console.log('🎵 Fetching Spotify top items...');

  // Получаем топ треки и артистов
  const [tracksResponse, artistsResponse] = await Promise.all([
    fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    }),
    fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
      headers: { 'Authorization': `Bearer ${spotifyToken}` }
    })
  ]);

  if (!tracksResponse.ok || !artistsResponse.ok) {
    if (tracksResponse.status === 401 || artistsResponse.status === 401) {
      console.log('⚠️ Spotify token expired');
      return NextResponse.json({ 
        error: 'Spotify token expired',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 401 });
    }
    
    throw new Error('Failed to fetch from Spotify');
  }

  const [tracks, artists] = await Promise.all([
    tracksResponse.json(),
    artistsResponse.json()
  ]);

  console.log(`✅ Got ${tracks.items?.length || 0} tracks and ${artists.items?.length || 0} artists`);

  return NextResponse.json({ tracks, artists });
}