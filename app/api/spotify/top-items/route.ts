// app/api/spotify/top-items/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
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
        console.log('❌ Spotify token expired');
        return NextResponse.json({ 
          error: 'Token expired',
          requiresAuth: true 
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to fetch data',
        tracks: { items: [] },
        artists: { items: [] }
      }, { status: 500 });
    }

    const tracks = await tracksResponse.json();
    const artists = await artistsResponse.json();

    // ВАЖНО: Добавляем жанры если их нет
    if (artists.items && artists.items.length > 0) {
      // Если жанров нет, генерируем на основе имён артистов
      artists.items = artists.items.map((artist: any) => {
        if (!artist.genres || artist.genres.length === 0) {
          // Простая логика определения жанров по имени (fallback)
          const name = artist.name.toLowerCase();
          const fallbackGenres = [];
          
          // Это временное решение - в идеале жанры должны приходить от Spotify
          if (name.includes('remix') || name.includes('dj')) fallbackGenres.push('electronic');
          if (name.includes('band')) fallbackGenres.push('rock');
          
          // Если ничего не нашли, добавляем общие жанры
          if (fallbackGenres.length === 0) {
            fallbackGenres.push('pop', 'contemporary');
          }
          
          artist.genres = fallbackGenres;
        }
        return artist;
      });
    }

    console.log(`✅ Fetched ${tracks.items?.length || 0} tracks and ${artists.items?.length || 0} artists`);
    
    // Логируем жанры для отладки
    const allGenres = new Set();
    artists.items?.forEach((artist: any) => {
      artist.genres?.forEach((g: string) => allGenres.add(g));
    });
    console.log('📊 Genres found:', Array.from(allGenres));

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