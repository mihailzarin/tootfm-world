// app/api/party/[code]/generate-playlist/route.ts
// Генерация плейлиста с учетом ВСЕХ музыкальных сервисов

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface UniversalTrack {
  name: string;
  artist: string;
  album?: string;
  sources: {
    spotify?: { id: string; uri: string; };
    lastfm?: { mbid?: string; url?: string; };
    apple?: { id: string; isrc?: string; };
  };
  matchScore: number;
  reasons: string[];
  matchedUsers: string[];
  sourceCount: number; // Сколько сервисов знают этот трек
}

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    console.log('🎵 Generating UNIVERSAL playlist for party:', code);

    // 1. Получаем party с участниками и их профилями
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              include: {
                musicProfile: true,
                musicServices: true // Подключенные сервисы каждого пользователя
              }
            }
          }
        },
        creator: {
          include: {
            musicProfile: true,
            musicServices: true
          }
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // 2. Анализируем какие сервисы используют участники
    const serviceStats = analyzeServices(party);
    console.log('📊 Service distribution:', serviceStats);

    // 3. Собираем музыкальные данные из ВСЕХ источников
    const universalProfiles = await collectUniversalProfiles(party);
    console.log(`🌍 Collected ${universalProfiles.length} universal profiles`);

    if (universalProfiles.length === 0) {
      return generateFallbackPlaylist(party);
    }

    // 4. Анализируем пересечения с учетом разных сервисов
    const analysis = analyzeUniversalProfiles(universalProfiles);
    console.log('🧬 Universal analysis:', {
      totalTracks: analysis.universalTracks.length,
      commonAcrossServices: analysis.crossServiceMatches,
      dominantService: analysis.dominantService
    });

    // 5. Генерируем рекомендации
    let recommendations: UniversalTrack[] = [];

    // Приоритет 1: Треки, которые есть во ВСЕХ сервисах участников
    const universalTracks = analysis.universalTracks
      .filter(t => t.sourceCount >= serviceStats.activeServices.length)
      .slice(0, 10);
    
    recommendations.push(...universalTracks);

    // Приоритет 2: Треки из доминирующего сервиса
    if (analysis.dominantService === 'spotify' && request.cookies.get('spotify_token')) {
      const spotifyRecs = await getSpotifyRecommendations(
        request.cookies.get('spotify_token')!.value,
        analysis
      );
      recommendations.push(...spotifyRecs);
    } else if (analysis.dominantService === 'lastfm') {
      const lastfmRecs = await getLastFmRecommendations(analysis);
      recommendations.push(...lastfmRecs);
    } else if (analysis.dominantService === 'apple') {
      const appleRecs = getAppleRecommendations(analysis);
      recommendations.push(...appleRecs);
    }

    // 6. Дедупликация и сортировка
    recommendations = deduplicateAndSort(recommendations);

    // 7. Сохраняем в БД с указанием источников
    const savedTracks = await saveUniversalTracks(
      party.id,
      party.creatorId,
      recommendations.slice(0, 30) // Топ 30 треков
    );

    console.log(`✅ Generated UNIVERSAL playlist with ${savedTracks.length} tracks`);

    return NextResponse.json({
      success: true,
      playlist: savedTracks,
      stats: {
        totalTracks: savedTracks.length,
        profilesAnalyzed: universalProfiles.length,
        servicesUsed: serviceStats.activeServices,
        crossServiceMatches: analysis.crossServiceMatches,
        dominantService: analysis.dominantService,
        coverage: {
          spotify: serviceStats.spotify,
          lastfm: serviceStats.lastfm,
          apple: serviceStats.apple
        }
      }
    });

  } catch (error) {
    console.error('❌ Universal playlist generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate playlist' },
      { status: 500 }
    );
  }
}

// Анализ используемых сервисов
function analyzeServices(party: any) {
  const services = {
    spotify: 0,
    lastfm: 0,
    apple: 0,
    youtube: 0
  };

  // Считаем создателя
  party.creator.musicServices.forEach((s: any) => {
    services[s.service.toLowerCase() as keyof typeof services]++;
  });

  // Считаем участников
  party.members.forEach((member: any) => {
    member.user.musicServices.forEach((s: any) => {
      services[s.service.toLowerCase() as keyof typeof services]++;
    });
  });

  const activeServices = Object.entries(services)
    .filter(([_, count]) => count > 0)
    .map(([service]) => service);

  const dominantService = Object.entries(services)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    ...services,
    activeServices,
    dominantService,
    totalUsers: party.members.length + 1
  };
}

// Сбор универсальных профилей
async function collectUniversalProfiles(party: any) {
  const profiles = [];

  // Функция для обработки профиля пользователя
  const processUserProfile = (user: any) => {
    if (!user.musicProfile) return null;

    const profile = user.musicProfile;
    const universalData: any = {
      userId: user.id,
      tracks: [],
      artists: [],
      genres: [],
      sources: []
    };

    // Парсим топ треки с сохранением источника
    if (profile.topTracks) {
      const tracks = JSON.parse(profile.topTracks);
      tracks.forEach((track: any) => {
        // Определяем источник по структуре данных
        let source = 'unknown';
        let id = null;
        
        if (track.spotifyId || track.id?.startsWith('spotify:')) {
          source = 'spotify';
          id = track.spotifyId || track.id;
        } else if (track.mbid || track.url?.includes('last.fm')) {
          source = 'lastfm';
          id = track.mbid;
        } else if (track.isrc || track.attributes?.playParams) {
          source = 'apple';
          id = track.id;
        }

        universalData.tracks.push({
          name: track.name,
          artist: track.artist || track.artists?.[0]?.name,
          album: track.album,
          source,
          sourceId: id,
          playcount: track.playcount || track.popularity || 0
        });
      });
    }

    // Парсим артистов
    if (profile.topArtists) {
      const artists = JSON.parse(profile.topArtists);
      artists.forEach((artist: any) => {
        let source = 'unknown';
        if (artist.id?.startsWith('spotify:')) source = 'spotify';
        else if (artist.mbid) source = 'lastfm';
        else if (artist.attributes) source = 'apple';

        universalData.artists.push({
          name: artist.name,
          source,
          sourceId: artist.id || artist.mbid,
          genres: artist.genres || []
        });
      });
    }

    // Парсим жанры
    if (profile.topGenres) {
      universalData.genres = JSON.parse(profile.topGenres);
    }

    // Определяем источники данных
    user.musicServices.forEach((service: any) => {
      universalData.sources.push(service.service.toLowerCase());
    });

    return universalData;
  };

  // Обрабатываем создателя
  const creatorProfile = processUserProfile(party.creator);
  if (creatorProfile) profiles.push(creatorProfile);

  // Обрабатываем участников
  for (const member of party.members) {
    const memberProfile = processUserProfile(member.user);
    if (memberProfile) profiles.push(memberProfile);
  }

  return profiles;
}

// Анализ универсальных профилей
function analyzeUniversalProfiles(profiles: any[]) {
  // Карта треков по нормализованному ключу
  const trackMap = new Map<string, any>();
  const artistMap = new Map<string, any>();
  const genreCount = new Map<string, number>();

  for (const profile of profiles) {
    // Обрабатываем треки
    profile.tracks.forEach((track: any) => {
      const key = normalizeTrackKey(track.name, track.artist);
      
      if (!trackMap.has(key)) {
        trackMap.set(key, {
          name: track.name,
          artist: track.artist,
          album: track.album,
          sources: {},
          users: new Set(),
          totalScore: 0,
          sourceCount: 0
        });
      }

      const entry = trackMap.get(key)!;
      
      // Добавляем источник
      if (!entry.sources[track.source]) {
        entry.sources[track.source] = {
          id: track.sourceId,
          count: 0
        };
        entry.sourceCount++;
      }
      entry.sources[track.source].count++;
      
      // Добавляем пользователя
      entry.users.add(profile.userId);
      entry.totalScore += track.playcount || 1;
    });

    // Обрабатываем артистов
    profile.artists.forEach((artist: any) => {
      const key = artist.name.toLowerCase();
      if (!artistMap.has(key)) {
        artistMap.set(key, {
          name: artist.name,
          sources: new Set(),
          users: new Set(),
          genres: artist.genres
        });
      }
      
      const entry = artistMap.get(key)!;
      entry.sources.add(artist.source);
      entry.users.add(profile.userId);
    });

    // Считаем жанры
    profile.genres.forEach((genre: string) => {
      genreCount.set(genre, (genreCount.get(genre) || 0) + 1);
    });
  }

  // Конвертируем в массивы и сортируем
  const universalTracks = Array.from(trackMap.values())
    .map(track => ({
      ...track,
      userCount: track.users.size,
      matchScore: calculateUniversalScore(track, profiles.length)
    }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const universalArtists = Array.from(artistMap.values())
    .map(artist => ({
      ...artist,
      sourceCount: artist.sources.size,
      userCount: artist.users.size
    }))
    .sort((a, b) => b.userCount - a.userCount);

  const topGenres = Array.from(genreCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([genre]) => genre);

  // Находим треки, которые есть в нескольких сервисах
  const crossServiceMatches = universalTracks
    .filter(t => t.sourceCount > 1).length;

  // Определяем доминирующий сервис
  const serviceCounts = { spotify: 0, lastfm: 0, apple: 0 };
  universalTracks.forEach(track => {
    Object.keys(track.sources).forEach(source => {
      serviceCounts[source as keyof typeof serviceCounts]++;
    });
  });
  
  const dominantService = Object.entries(serviceCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  return {
    universalTracks,
    universalArtists,
    topGenres,
    crossServiceMatches,
    dominantService,
    averageSourcesPerTrack: universalTracks.reduce((sum, t) => 
      sum + t.sourceCount, 0) / universalTracks.length
  };
}

// Нормализация ключа трека для сравнения
function normalizeTrackKey(name: string, artist: string): string {
  const normalizedName = name
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Убираем спецсимволы
    .replace(/\s+/g, ' ')     // Нормализуем пробелы
    .replace(/\s*\(.*?\)\s*/g, '') // Убираем скобки с ремиксами
    .replace(/\s*\[.*?\]\s*/g, '') // Убираем квадратные скобки
    .trim();

  const normalizedArtist = artist
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .split(/[,&]/) // Разделяем featuring
    [0].trim();

  return `${normalizedArtist}-${normalizedName}`;
}

// Расчет универсального score
function calculateUniversalScore(track: any, totalUsers: number): number {
  let score = 0;
  
  // Базовый score за количество пользователей
  score += (track.userCount / totalUsers) * 40;
  
  // Бонус за присутствие в нескольких сервисах
  score += track.sourceCount * 15;
  
  // Бонус за популярность (playcount)
  const avgPlaycount = track.totalScore / track.userCount;
  if (avgPlaycount > 100) score += 20;
  else if (avgPlaycount > 50) score += 15;
  else if (avgPlaycount > 20) score += 10;
  
  // Бонус если трек есть у большинства
  if (track.userCount > totalUsers * 0.5) score += 20;
  
  return Math.min(100, Math.round(score));
}

// Получение рекомендаций от Spotify
async function getSpotifyRecommendations(token: string, analysis: any): Promise<UniversalTrack[]> {
  // Используем существующую логику из предыдущей версии
  // но возвращаем UniversalTrack формат
  const tracks: UniversalTrack[] = [];
  
  try {
    // Запрос к Spotify Recommendations API
    // ... (код из предыдущей версии)
    
    // Форматируем в универсальный формат
    // tracks.push({
    //   name, artist, sources: { spotify: { id, uri } }, ...
    // });
  } catch (error) {
    console.error('Spotify recommendations failed:', error);
  }
  
  return tracks;
}

// Получение рекомендаций от Last.fm
async function getLastFmRecommendations(analysis: any): Promise<UniversalTrack[]> {
  const tracks: UniversalTrack[] = [];
  
  // Last.fm API для похожих треков
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) return tracks;
  
  try {
    // Берем топ треки и ищем похожие
    for (const track of analysis.universalTracks.slice(0, 3)) {
      if (track.sources.lastfm) {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&artist=${encodeURIComponent(track.artist)}&track=${encodeURIComponent(track.name)}&api_key=${apiKey}&format=json&limit=5`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          // Обрабатываем и добавляем в tracks
        }
      }
    }
  } catch (error) {
    console.error('Last.fm recommendations failed:', error);
  }
  
  return tracks;
}

// Рекомендации для Apple Music
function getAppleRecommendations(analysis: any): UniversalTrack[] {
  // Так как у нас нет прямого API Apple Music,
  // используем треки из профилей пользователей Apple
  return analysis.universalTracks
    .filter((t: any) => t.sources.apple)
    .slice(0, 10)
    .map((t: any) => ({
      ...t,
      reasons: ['Popular in Apple Music libraries']
    }));
}

// Дедупликация и сортировка
function deduplicateAndSort(tracks: UniversalTrack[]): UniversalTrack[] {
  const seen = new Map<string, UniversalTrack>();
  
  tracks.forEach(track => {
    const key = normalizeTrackKey(track.name, track.artist);
    
    if (!seen.has(key) || track.matchScore > seen.get(key)!.matchScore) {
      seen.set(key, track);
    } else {
      // Объединяем источники
      const existing = seen.get(key)!;
      Object.assign(existing.sources, track.sources);
      existing.sourceCount = Object.keys(existing.sources).length;
      existing.reasons = [...new Set([...existing.reasons, ...track.reasons])];
    }
  });
  
  return Array.from(seen.values())
    .sort((a, b) => b.matchScore - a.matchScore);
}

// Сохранение универсальных треков
async function saveUniversalTracks(
  partyId: string,
  creatorId: string,
  tracks: UniversalTrack[]
) {
  const savedTracks = [];
  
  for (const track of tracks) {
    try {
      // Используем Spotify ID если есть, иначе создаем уникальный
      const spotifyId = track.sources.spotify?.id || 
                       `universal-${Buffer.from(track.name + track.artist).toString('base64')}`;
      
      const existingTrack = await prisma.track.findFirst({
        where: { partyId, spotifyId }
      });

      if (!existingTrack) {
        const saved = await prisma.track.create({
          data: {
            spotifyId,
            name: track.name,
            artist: track.artist,
            album: track.album || null,
            albumArt: null, // TODO: получить из сервисов
            duration: 180000,
            partyId,
            addedById: creatorId,
            voteCount: track.matchScore || 0
          }
        });

        savedTracks.push({
          ...saved,
          matchScore: track.matchScore,
          reasons: track.reasons,
          sources: track.sources,
          sourceCount: track.sourceCount
        });
      }
    } catch (error) {
      console.error(`Failed to save track ${track.name}:`, error);
    }
  }
  
  return savedTracks;
}

// Fallback плейлист
async function generateFallbackPlaylist(party: any) {
  // Используем существующую логику
  return NextResponse.json({
    success: true,
    playlist: [],
    fallback: true,
    stats: {
      totalTracks: 0,
      profilesAnalyzed: 0,
      servicesUsed: [],
      crossServiceMatches: 0
    }
  });
}