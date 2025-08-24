import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(req: Request) {
  try {
    // Проверяем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in' 
      }, { status: 401 });
    }
    
    // Получаем все подключенные музыкальные сервисы
    const musicServices = await prisma.musicService.findMany({
      where: {
        userId: session.user.id,
        isActive: true
      }
    });
    
    if (musicServices.length === 0) {
      return NextResponse.json({ 
        error: 'No music services connected' 
      }, { status: 400 });
    }
    
    // Собираем данные из всех сервисов
    const musicData = {
      spotify: null as any,
      lastfm: null as any,
      apple: null as any
    };
    
    // Массив для унифицированных треков
    let unifiedTopTracks: any[] = [];
    
    for (const service of musicServices) {
      if (service.service === 'SPOTIFY' && service.accessToken) {
        // Получаем топ треки из Spotify
        try {
          const topTracksResponse = await fetch(
            'https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term',
            {
              headers: {
                'Authorization': `Bearer ${service.accessToken}`
              }
            }
          );
          
          if (topTracksResponse.ok) {
            const topTracksData = await topTracksResponse.json();
            
            // Получаем топ артистов
            const topArtistsResponse = await fetch(
              'https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term',
              {
                headers: {
                  'Authorization': `Bearer ${service.accessToken}`
                }
              }
            );
            
            const topArtists = topArtistsResponse.ok ? 
              await topArtistsResponse.json() : { items: [] };
            
            musicData.spotify = {
              topTracks: topTracksData.items || [],
              topArtists: topArtists.items || [],
              connected: true
            };
            
            // ВАЖНО: Форматируем треки для unifiedTopTracks
            const formattedTracks = topTracksData.items.map((track: any) => ({
              id: track.id,
              spotifyId: track.id,
              name: track.name,
              artist: track.artists[0]?.name || 'Unknown',
              artists: track.artists,
              album: track.album,
              preview_url: track.preview_url,
              duration_ms: track.duration_ms,
              external_ids: track.external_ids
            }));
            
            // Добавляем в унифицированный массив
            unifiedTopTracks = [...unifiedTopTracks, ...formattedTracks];
          }
        } catch (error) {
          console.error('Error fetching Spotify data:', error);
        }
      }
      
      if (service.service === 'LASTFM' && service.lastfmUsername) {
        // Получаем данные из Last.fm
        try {
          const response = await fetch(
            `https://ws.audioscrobbler.com/2.0/?method=user.getTopTracks&user=${service.lastfmUsername}&api_key=${process.env.LASTFM_API_KEY}&format=json&limit=50&period=6month`
          );
          
          if (response.ok) {
            const data = await response.json();
            musicData.lastfm = {
              topTracks: data.toptracks?.track || [],
              username: service.lastfmUsername,
              connected: true
            };
            
            // Добавляем Last.fm треки в унифицированный массив
            if (data.toptracks?.track) {
              const lastfmTracks = data.toptracks.track.map((track: any) => ({
                name: track.name,
                artist: track.artist?.name || track.artist,
                lastfmId: track.mbid,
                playcount: track.playcount
              }));
              unifiedTopTracks = [...unifiedTopTracks, ...lastfmTracks];
            }
          }
        } catch (error) {
          console.error('Error fetching Last.fm data:', error);
        }
      }
      
      if (service.service === 'APPLE' && service.appleToken) {
        // Apple Music данные (если токен есть)
        musicData.apple = {
          connected: true,
          token: 'present' // Не отправляем сам токен
        };
      }
    }
    
    // Генерируем музыкальный портрет
    const portrait = generateMusicPortrait(musicData);
    
    // Сохраняем или обновляем профиль
    const musicProfile = await prisma.musicProfile.upsert({
      where: {
        userId: session.user.id
      },
      update: {
        // ВАЖНО: Сохраняем унифицированные треки для генерации плейлиста
        unifiedTopTracks: unifiedTopTracks.length > 0 ? JSON.stringify(unifiedTopTracks) : Prisma.JsonNull,
        spotifyData: musicData.spotify ? JSON.stringify(musicData.spotify) : Prisma.JsonNull,
        lastfmData: musicData.lastfm ? JSON.stringify(musicData.lastfm) : Prisma.JsonNull,
        appleData: musicData.apple ? JSON.stringify(musicData.apple) : Prisma.JsonNull,
        musicPersonality: portrait.personality,
        dominantGenres: portrait.genres,
        energyLevel: portrait.energy,
        diversityScore: portrait.diversity,
        mainstreamScore: portrait.mainstream,
        lastAnalyzed: new Date()
      },
      create: {
        userId: session.user.id,
        unifiedTopTracks: unifiedTopTracks.length > 0 ? JSON.stringify(unifiedTopTracks) : Prisma.JsonNull,
        spotifyData: musicData.spotify ? JSON.stringify(musicData.spotify) : Prisma.JsonNull,
        lastfmData: musicData.lastfm ? JSON.stringify(musicData.lastfm) : Prisma.JsonNull,
        appleData: musicData.apple ? JSON.stringify(musicData.apple) : Prisma.JsonNull,
        musicPersonality: portrait.personality,
        dominantGenres: portrait.genres,
        energyLevel: portrait.energy,
        diversityScore: portrait.diversity,
        mainstreamScore: portrait.mainstream,
        lastAnalyzed: new Date()
      }
    });
    
    return NextResponse.json({
      success: true,
      profile: portrait,
      services: {
        spotify: !!musicData.spotify,
        lastfm: !!musicData.lastfm,
        apple: !!musicData.apple
      }
    });
    
  } catch (error) {
    console.error('Error in music analyze:', error);
    return NextResponse.json({ 
      error: 'Failed to analyze music profile' 
    }, { status: 500 });
  }
}

// Функция генерации портрета
function generateMusicPortrait(data: any) {
  const genres: string[] = [];
  let totalTracks = 0;
  
  // Извлекаем жанры из Spotify
  if (data.spotify?.topArtists) {
    data.spotify.topArtists.forEach((artist: any) => {
      if (artist.genres) {
        genres.push(...artist.genres);
      }
    });
    totalTracks += data.spotify.topTracks?.length || 0;
  }
  
  // Считаем уникальные жанры
  const genreCount = new Map<string, number>();
  genres.forEach(genre => {
    genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
  });
  
  // Топ жанры
  const topGenres = Array.from(genreCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre);
  
  // Определяем personality
  let personality = 'Music Explorer 🎵';
  if (topGenres.includes('pop')) personality = 'Pop Enthusiast 🌟';
  else if (topGenres.includes('rock')) personality = 'Rock Warrior 🎸';
  else if (topGenres.includes('electronic')) personality = 'Electronic Soul 🎛️';
  else if (topGenres.includes('hip hop')) personality = 'Hip Hop Head 🎤';
  else if (topGenres.includes('indie')) personality = 'Indie Spirit 🌻';
  
  return {
    personality,
    genres: topGenres,
    energy: Math.random() * 100,
    diversity: Math.min(100, genreCount.size * 10),
    mainstream: Math.random() * 100,
    totalTracks,
    servicesConnected: [
      data.spotify && 'Spotify',
      data.lastfm && 'Last.fm',
      data.apple && 'Apple Music'
    ].filter(Boolean)
  };
}