// app/api/party/[code]/generate-playlist/route.ts
// ФИНАЛЬНАЯ ВЕРСИЯ: Поддержка Spotify + Last.fm + Apple Music
// С исправлением всех ошибок и детальным логированием

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ==========================================
// ТИПЫ
// ==========================================

interface UniversalTrack {
  name: string;
  artist: string;
  album?: string;
  sources: {
    spotify?: string;
    lastfm?: string;
    apple?: string;
  };
  matchScore: number;
  sourceCount: number;
}

// ==========================================
// ГЛАВНАЯ ФУНКЦИЯ
// ==========================================

export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    console.log('🎵 Generating UNIVERSAL playlist for party:', code);

    // 1. Получаем party с профилями
    const party = await prisma.party.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        members: {
          include: {
            user: {
              include: {
                musicProfile: true
              }
            }
          }
        },
        creator: {
          include: {
            musicProfile: true
          }
        },
        tracks: true // Существующие треки
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    console.log(`✅ Found party: ${party.name}`);
    console.log(`👥 Members: ${party.members.length}`);
    console.log(`🎵 Existing tracks: ${party.tracks.length}`);

    // Очищаем старые треки
    if (party.tracks.length > 0) {
      console.log('🗑️ Clearing old tracks...');
      await prisma.track.deleteMany({
        where: { partyId: party.id }
      });
    }

    // 2. Собираем профили
    const profiles = [];
    
    if (party.creator?.musicProfile) {
      profiles.push({
        userId: party.creator.id,
        profile: party.creator.musicProfile
      });
    }
    
    party.members.forEach(member => {
      if (member.user?.musicProfile) {
        profiles.push({
          userId: member.user.id,
          profile: member.user.musicProfile
        });
      }
    });

    console.log(`📊 Found ${profiles.length} music profiles`);

    // 3. Анализируем профили из ВСЕХ сервисов
    const universalTracks = analyzeUniversalProfiles(profiles);
    console.log(`🌍 Analyzed ${universalTracks.length} universal tracks`);

    // 4. Получаем дополнительные рекомендации
    let recommendations: UniversalTrack[] = [...universalTracks];
    
    // Добавляем рекомендации от Spotify если есть токен
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    if (spotifyToken && recommendations.length < 20) {
      const spotifyRecs = await getSpotifyRecommendations(spotifyToken, profiles);
      recommendations.push(...spotifyRecs);
    }


    // 5. Дедупликация и сортировка
    recommendations = deduplicateAndSort(recommendations).slice(0, 30);

    // 6. Сохраняем в БД
    const savedTracks = [];
    const saveErrors = [];

    for (let i = 0; i < recommendations.length && i < 20; i++) {
      const track = recommendations[i];
      
      try {
        // Используем Spotify ID если есть, иначе генерируем
        const spotifyId = track.sources.spotify || 
                         `gen-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        
        console.log(`💾 Saving ${i + 1}/${recommendations.length}: ${track.name} by ${track.artist}`);
        
        const saved = await prisma.track.create({
          data: {
        const saved = await prisma.track.create({
          data: {
            spotifyId: spotifyId,
            name: track.name,
            artist: track.artist,
            album: track.album || null,
            albumArt: null,
            duration: 180000,
            partyId: party.id,
            addedById: party.creatorId,
            voteCount: track.matchScore || (10 - i)
          }
        });
        
        savedTracks.push({
          ...saved,
          sources: track.sources,
          sourceCount: track.sourceCount
        });        saveErrors.push({
          track: `${track.name} - ${track.artist}`,
          error: error instanceof Error ? error.message : 'Unknown'
        });
      }
    }

    console.log(`✅ Saved ${savedTracks.length} tracks successfully`);

    // 7. Возвращаем результат
    return NextResponse.json({
      success: true,
      playlist: savedTracks,
      stats: {
        totalTracks: savedTracks.length,
        profilesAnalyzed: profiles.length,
        universalTracksFound: universalTracks.length,
        errors: saveErrors.length,
        sources: getSourceStats(savedTracks)
      },
      errors: saveErrors.length > 0 ? saveErrors : undefined
    });

  } catch (error) {
    console.error('❌ Critical error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate playlist',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ==========================================
// АНАЛИЗ УНИВЕРСАЛЬНЫХ ПРОФИЛЕЙ
// ==========================================

function analyzeUniversalProfiles(profiles: any[]): UniversalTrack[] {
function analyzeUniversalProfiles(profiles: any[]): UniversalTrack[] {
  const trackMap = new Map<string, UniversalTrack>();
  console.log(`🔍 Analyzing ${profiles.length} profiles...`);

  profiles.forEach(({ profile }, profileIndex) => {
    console.log(`📊 Profile ${profileIndex + 1}:`, {
      hasTopTracks: !!profile.topTracks,
      hasTopArtists: !!profile.topArtists
    });
    
    if (!profile.topTracks) {
      console.log(`⚠️ Profile ${profileIndex + 1} has no topTracks`);
      return;
    }

    try {
      const tracks = JSON.parse(profile.topTracks);
      console.log(`🎵 Found ${tracks.length} tracks in profile ${profileIndex + 1}`);
      
      tracks.forEach((track: any, trackIndex: number) => {
        // Более детальное логирование
        if (trackIndex < 5) {
          console.log(`  Track ${trackIndex + 1}:`, {
            name: track.name,
            artist: track.artist || track.artists?.[0]?.name,
            source: track.source
          });
        }
        
        // Улучшенное определение источника
        let source = 'unknown';
        let sourceId = '';
        
        if (track.source === 'Spotify' || track.spotifyId || track.id?.includes('spotify')) {
          source = 'spotify';
          sourceId = track.spotifyId || track.id;
        } else if (track.source === 'Last.fm' || track.mbid || track.url?.includes('last.fm')) {
          source = 'lastfm';
          sourceId = track.mbid || track.url || '';
        } else if (track.source === 'Apple Music' || track.isrc || track.attributes) {
          source = 'apple';
          sourceId = track.isrc || track.id || '';
        }
        
        // Нормализуем artist
        const artistName = typeof track.artist === 'string' 
          ? track.artist 
          : (track.artist?.name || track.artist?.['#text'] || track.artists?.[0]?.name || 'Unknown Artist');
        
        const key = normalizeTrackKey(track.name, artistName);
        
        if (!trackMap.has(key)) {
          trackMap.set(key, {
            name: track.name,
            artist: artistName,
            album: track.album || track.album?.name,
            sources: {},
            matchScore: 0,
            sourceCount: 0
          });
        }
        
        const entry = trackMap.get(key)!;
        
        // Добавляем источник
        if (source !== 'unknown') {
          entry.sources[source] = sourceId;
          entry.sourceCount = Object.keys(entry.sources).length;
        }
        
        // Увеличиваем score (больше за популярность в профиле)
        entry.matchScore += (tracks.length - trackIndex) + 10;
      });
    } catch (e) {
      console.error(`❌ Error parsing tracks in profile ${profileIndex + 1}:`, e);
    }
  });

  const result = Array.from(trackMap.values())
    .sort((a, b) => {
      // Приоритет: треки из нескольких источников
      if (a.sourceCount !== b.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }
      return b.matchScore - a.matchScore;
    });
  
  console.log(`✅ Generated ${result.length} universal tracks`);
  result.slice(0, 10).forEach((track, i) => {
    console.log(`  ${i + 1}. ${track.name} - ${track.artist} (score: ${track.matchScore}, sources: ${track.sourceCount})`);
  });
  
  return result;
}          sourceId = track.isrc || track.id || '';
        }

        // Нормализуем ключ
        const key = normalizeTrackKey(
          track.name, 
          track.artist || track.artists?.[0]?.name || 'Unknown'
        );

        // Добавляем или обновляем трек
        if (!trackMap.has(key)) {
          trackMap.set(key, {
            name: track.name,
            artist: track.artist || track.artists?.[0]?.name || 'Unknown',
            album: track.album || track.album?.name,
            sources: {},
            matchScore: 0,
            sourceCount: 0
          });
        }

        const entry = trackMap.get(key)!;
        
        // Добавляем источник
        if (source !== 'unknown' && sourceId) {
          entry.sources[source] = sourceId;
          entry.sourceCount = Object.keys(entry.sources).length;
        }
        
        // Увеличиваем score
        entry.matchScore += 10;
      });
    } catch (e) {
      console.error('Error parsing tracks:', e);
    }
  });

  // Конвертируем в массив и сортируем
  return Array.from(trackMap.values())
    .sort((a, b) => {
      // Приоритет: треки из нескольких источников
      if (a.sourceCount !== b.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }
      return b.matchScore - a.matchScore;
    });
}

// ==========================================
// SPOTIFY РЕКОМЕНДАЦИИ
// ==========================================

async function getSpotifyRecommendations(token: string, profiles: any[]): Promise<UniversalTrack[]> {
  try {
    // Собираем жанры из профилей
    const genres = new Set<string>();
    
    profiles.forEach(({ profile }) => {
      if (profile.topGenres) {
        try {
          const profileGenres = JSON.parse(profile.topGenres);
          profileGenres.forEach((g: string) => genres.add(g));
        } catch (e) {}
      }
    });

    // Форматируем жанры для Spotify
    const seedGenres = Array.from(genres)
      .map(g => g.toLowerCase().replace(/\s+/g, '-'))
      .filter(g => ['pop', 'rock', 'hip-hop', 'electronic', 'indie'].some(v => g.includes(v)))
      .slice(0, 2);

    if (seedGenres.length === 0) {
      seedGenres.push('pop'); // Fallback
    }

    console.log('🎧 Spotify genres:', seedGenres);

    const params = new URLSearchParams({
      limit: '10',
      market: 'US',
      seed_genres: seedGenres.join(',')
    });

    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${params}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );

    if (!response.ok) {
      console.error('Spotify API error:', response.status);
      return [];
    }

    const data = await response.json();
    
    return data.tracks.map((track: any) => ({
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      album: track.album?.name,
      sources: { spotify: track.id },
      matchScore: 50,
      sourceCount: 1
    }));

  } catch (error) {
    console.error('Spotify recommendations error:', error);
    return [];
  }
}

// ==========================================
// УТИЛИТЫ
// ==========================================

function normalizeTrackKey(name: string, artist: string): string {
  const normalizedName = name
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .trim();

  const normalizedArtist = artist
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .split(/[,&]/)[0]
    .trim();

  return `${normalizedArtist}-${normalizedName}`;
}

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
      existing.matchScore = Math.max(existing.matchScore, track.matchScore);
    }
  });
  
  return Array.from(seen.values())
    .sort((a, b) => {
      if (a.sourceCount !== b.sourceCount) {
        return b.sourceCount - a.sourceCount;
      }
      return b.matchScore - a.matchScore;
    });
}

function getSourceStats(tracks: any[]): any {
  const stats = {
    spotify: 0,
    lastfm: 0,
    apple: 0,
    multiSource: 0
  };
  
  tracks.forEach(track => {
    if (track.sources) {
      if (track.sources.spotify) stats.spotify++;
      if (track.sources.lastfm) stats.lastfm++;
      if (track.sources.apple) stats.apple++;
      if (track.sourceCount > 1) stats.multiSource++;
    }
  });
  
  return stats;
}

function getDefaultTracks(): UniversalTrack[] {
  return [
    { 
      name: "Blinding Lights", 
      artist: "The Weeknd",
      sources: { spotify: "0VjIjW4GlUZAMYd2vXMi3b" },
      matchScore: 30,
      sourceCount: 1
    },
    { 
      name: "Levitating", 
      artist: "Dua Lipa",
      sources: { spotify: "6cx06DFPPHchuUAcTxznu9" },
      matchScore: 28,
      sourceCount: 1
    },
    { 
      name: "Stay", 
      artist: "The Kid LAROI, Justin Bieber",
      sources: { spotify: "5PjdY0CKGZdEuoNab3yDmX" },
      matchScore: 26,
      sourceCount: 1
    },
    { 
      name: "Heat Waves", 
      artist: "Glass Animals",
      sources: { spotify: "02MWAaffLxlfxAUY7c5dvx" },
      matchScore: 24,
      sourceCount: 1
    },
    { 
      name: "Good 4 U", 
      artist: "Olivia Rodrigo",
      sources: { spotify: "4ZtFanR9U6ndgddUvNcjcG" },
      matchScore: 22,
      sourceCount: 1
    }
  ];
}