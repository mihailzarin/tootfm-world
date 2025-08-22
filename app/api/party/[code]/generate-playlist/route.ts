// app/api/party/[code]/generate-playlist/route.ts
// ФИНАЛЬНАЯ ВЕРСИЯ: Поддержка Spotify + Last.fm + Apple Music

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
// ГЛАВНАЯ ФУНКЦИЯ - ИСПРАВЛЕННАЯ СИГНАТУРА
// ==========================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params; // await для Next.js 15
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
        }
      }
    });

    if (!party) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    // 2. Собираем профили
    const profiles = [];
    
    // Добавляем профиль создателя
    if (party.creator.musicProfile) {
      profiles.push({
        userId: party.creator.id,
        profile: party.creator.musicProfile
      });
    }

    // Добавляем профили участников
    party.members.forEach(member => {
      if (member.user.musicProfile) {
        profiles.push({
          userId: member.user.id,
          profile: member.user.musicProfile
        });
      }
    });

    console.log(`📊 Found ${profiles.length} music profiles`);

    if (profiles.length === 0) {
      return NextResponse.json({
        error: 'No music profiles found',
        message: 'Party members need to analyze their music first'
      }, { status: 400 });
    }

    // 3. Анализируем профили
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
        });
        
      } catch (error) {
        console.error(`❌ Failed to save: ${track.name}`, error);
        saveErrors.push({
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
  const trackMap = new Map<string, UniversalTrack>();
  console.log(`🔍 Analyzing ${profiles.length} profiles...`);

  profiles.forEach(({ profile }, profileIndex) => {
    console.log(`📊 Profile ${profileIndex + 1}:`, {
      hasTopTracks: !!profile.unifiedTopTracks,
      hasTopArtists: !!profile.unifiedTopArtists
    });
    
    // Обрабатываем треки из MusicProfile
    if (profile.unifiedTopTracks) {
      try {
        const tracks = typeof profile.unifiedTopTracks === 'string' 
          ? JSON.parse(profile.unifiedTopTracks) 
          : profile.unifiedTopTracks;
        
        if (Array.isArray(tracks)) {
          tracks.forEach((track: any) => {
            const key = `${track.name}-${track.artists?.[0]?.name || track.artist}`;
            
            if (trackMap.has(key)) {
              const existing = trackMap.get(key)!;
              existing.matchScore++;
              existing.sourceCount++;
            } else {
              trackMap.set(key, {
                name: track.name,
                artist: track.artists?.[0]?.name || track.artist || 'Unknown',
                album: track.album?.name || track.album,
                sources: {
                  spotify: track.id || track.spotifyId,
                  lastfm: track.lastfmId,
                  apple: track.appleId
                },
                matchScore: 1,
                sourceCount: 1
              });
            }
          });
        }
      } catch (e) {
        console.error('Error parsing tracks:', e);
      }
    }
  });

  return Array.from(trackMap.values())
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ==========================================
// SPOTIFY РЕКОМЕНДАЦИИ
// ==========================================

async function getSpotifyRecommendations(
  token: string,
  profiles: any[]
): Promise<UniversalTrack[]> {
  try {
    // Собираем seed артистов и жанры
    const seedArtists = new Set<string>();
    const seedGenres = new Set<string>();
    
    profiles.forEach(({ profile }) => {
      if (profile.unifiedTopArtists) {
        try {
          const artists = typeof profile.unifiedTopArtists === 'string'
            ? JSON.parse(profile.unifiedTopArtists)
            : profile.unifiedTopArtists;
          
          if (Array.isArray(artists)) {
            artists.slice(0, 2).forEach((artist: any) => {
              if (artist.id) seedArtists.add(artist.id);
            });
          }
        } catch (e) {
          console.error('Error parsing artists:', e);
        }
      }
      
      if (profile.unifiedTopGenres) {
        try {
          const genres = typeof profile.unifiedTopGenres === 'string'
            ? JSON.parse(profile.unifiedTopGenres)
            : profile.unifiedTopGenres;
          
          if (Array.isArray(genres)) {
            genres.slice(0, 2).forEach((genre: string) => {
              seedGenres.add(genre.toLowerCase().replace(' ', '-'));
            });
          }
        } catch (e) {
          console.error('Error parsing genres:', e);
        }
      }
    });

    const seedArtistsList = Array.from(seedArtists).slice(0, 3);
    const seedGenresList = Array.from(seedGenres).slice(0, 2);
    
    if (seedArtistsList.length === 0 && seedGenresList.length === 0) {
      return [];
    }

    const params = new URLSearchParams({
      seed_artists: seedArtistsList.join(','),
      seed_genres: seedGenresList.join(','),
      limit: '10'
    });

    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${params}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      console.error('Spotify recommendations failed:', response.status);
      return [];
    }

    const data = await response.json();
    
    return data.tracks.map((track: any) => ({
      name: track.name,
      artist: track.artists[0].name,
      album: track.album.name,
      sources: {
        spotify: track.id
      },
      matchScore: 0.5,
      sourceCount: 1
    }));
    
  } catch (error) {
    console.error('Error getting Spotify recommendations:', error);
    return [];
  }
}

// ==========================================
// ДЕДУПЛИКАЦИЯ И СОРТИРОВКА
// ==========================================

function deduplicateAndSort(tracks: UniversalTrack[]): UniversalTrack[] {
  const uniqueMap = new Map<string, UniversalTrack>();
  
  tracks.forEach(track => {
    const key = `${track.name.toLowerCase()}-${track.artist.toLowerCase()}`;
    
    if (uniqueMap.has(key)) {
      const existing = uniqueMap.get(key)!;
      // Объединяем источники
      existing.sources = { ...existing.sources, ...track.sources };
      existing.matchScore = Math.max(existing.matchScore, track.matchScore);
      existing.sourceCount = Math.max(existing.sourceCount, track.sourceCount);
    } else {
      uniqueMap.set(key, track);
    }
  });
  
  return Array.from(uniqueMap.values())
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ==========================================
// СТАТИСТИКА ИСТОЧНИКОВ
// ==========================================

function getSourceStats(tracks: any[]): Record<string, number> {
  const stats: Record<string, number> = {
    spotify: 0,
    lastfm: 0,
    apple: 0
  };
  
  tracks.forEach(track => {
    if (track.sources?.spotify) stats.spotify++;
    if (track.sources?.lastfm) stats.lastfm++;
    if (track.sources?.apple) stats.apple++;
  });
  
  return stats;
}
