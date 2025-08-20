// app/api/spotify/top-items/route.ts
// Endpoint для получения топ треков и артистов из Spotify

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из cookies
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    
    if (!spotifyToken) {
      console.log('❌ No Spotify token found');
      return NextResponse.json({ 
        error: 'Spotify not connected',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 401 });
    }

    console.log('🎵 Fetching Spotify top items...');

    // Параллельно запрашиваем топ треки и артистов
    const [tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${spotifyToken}` }
      })
    ]);

    // Проверяем ответы
    if (!tracksResponse.ok || !artistsResponse.ok) {
      if (tracksResponse.status === 401 || artistsResponse.status === 401) {
        console.log('❌ Spotify token expired');
        return NextResponse.json({ 
          error: 'Token expired',
          requiresAuth: true 
        }, { status: 401 });
      }
      
      console.error('❌ Spotify API error');
      return NextResponse.json({ 
        error: 'Failed to fetch data',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 500 });
    }

    const tracks = await tracksResponse.json();
    const artists = await artistsResponse.json();

    console.log(`✅ Fetched ${tracks.items?.length || 0} tracks and ${artists.items?.length || 0} artists`);

    // Возвращаем в формате, который ожидает MusicPortrait
    return NextResponse.json({
      tracks: tracks,
      artists: artists
    });

  } catch (error) {
    console.error('❌ Error fetching Spotify data:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      tracks: { items: [] },
      artists: { items: [] }
    }, { status: 500 });
  }
}