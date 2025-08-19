// app/api/music/analyze-v2/route.ts
// УЛУЧШЕННАЯ ВЕРСИЯ с максимальным сбором данных

import { NextRequest, NextResponse } from 'next/server';

// Интерфейсы для типизации
interface EnhancedMusicProfile {
  // Основные данные
  topTracks: any[];
  topArtists: any[];
  topGenres: string[];
  
  // Расширенные данные
  recentTracks: any[];
  savedTracks: any[];
  followedArtists: any[];
  playlists: any[];
  
  // Аналитика
  musicPersonality: string;
  energyLevel: number;
  diversityScore: number;
  moodProfile: {
    happiness: number;
    energy: number;
    danceability: number;
    acousticness: number;
    valence: number;
  };
  
  // Временные паттерны
  listeningPatterns: {
    morningGenres: string[];
    eveningGenres: string[];
    weekendGenres: string[];
    seasonalTrends: any[];
  };
  
  // Статистика
  stats: {
    totalTracks: number;
    totalArtists: number;
    totalGenres: number;
    avgPopularity: number;
    avgTrackAge: number;
    mostActiveHour: number;
    mostActiveDay: string;
  };
  
  // Метаданные
  sources: string[];
  analyzedAt: Date;
  dataPoints: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, appleLibrary, deepAnalysis = true } = body;
    
    console.log('🎵 Starting enhanced music analysis for:', userId);
    console.log('🔍 Deep analysis mode:', deepAnalysis);

    const cookies = request.cookies;
    const spotifyToken = cookies.get('spotify_token')?.value;
    const lastfmUsername = cookies.get('lastfm_username')?.value;
    const lastfmSession = cookies.get('lastfm_session')?.value;

    // Инициализация профиля
    const profile: Partial<EnhancedMusicProfile> = {
      topTracks: [],
      topArtists: [],
      topGenres: [],
      recentTracks: [],
      savedTracks: [],
      followedArtists: [],
      playlists: [],
      sources: [],
      dataPoints: 0
    };

    // ===========================================
    // 1. SPOTIFY - МАКСИМАЛЬНЫЙ СБОР ДАННЫХ
    // ===========================================
    if (spotifyToken) {
      console.log('🎧 Fetching comprehensive Spotify data...');
      
      try {
        // 1.1 Top Tracks (ВСЕ периоды)
        const timeRanges = ['short_term', 'medium_term', 'long_term'];
        const allTopTracks: any[] = [];
        
        for (const timeRange of timeRanges) {
          const response = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
          );
          
          if (response.ok) {
            const data = await response.json();
            data.items.forEach((track: any) => {
              track.timeRange = timeRange;
              track.source = 'Spotify';
              allTopTracks.push(track);
            });
            profile.dataPoints! += data.items.length;
          }
        }
        
        // Убираем дубликаты и сортируем по популярности
        const uniqueTracks = deduplicateTracks(allTopTracks);
        profile.topTracks = uniqueTracks.slice(0, 50);
        console.log(`✅ Got ${uniqueTracks.length} unique top tracks from Spotify`);

        // 1.2 Top Artists (ВСЕ периоды)
        const allTopArtists: any[] = [];
        
        for (const timeRange of timeRanges) {
          const response = await fetch(
            `https://api.spotify.com/v1/me/top/artists?limit=50&time_range=${timeRange}`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
          );
          
          if (response.ok) {
            const data = await response.json();
            data.items.forEach((artist: any) => {
              artist.timeRange = timeRange;
              artist.source = 'Spotify';
              allTopArtists.push(artist);
              
              // Собираем жанры
              if (artist.genres) {
                profile.topGenres!.push(...artist.genres);
              }
            });
            profile.dataPoints! += data.items.length;
          }
        }
        
        profile.topArtists = deduplicateArtists(allTopArtists).slice(0, 50);
        console.log(`✅ Got ${profile.topArtists.length} unique artists from Spotify`);

        // 1.3 Recently Played (последние 50)
        const recentResponse = await fetch(
          'https://api.spotify.com/v1/me/player/recently-played?limit=50',
          { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        );
        
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          profile.recentTracks = recentData.items.map((item: any) => ({
            ...item.track,
            playedAt: item.played_at,
            source: 'Spotify'
          }));
          profile.dataPoints! += recentData.items.length;
          console.log(`✅ Got ${recentData.items.length} recently played tracks`);
        }

        // 1.4 Saved Tracks (любимые треки)
        const savedResponse = await fetch(
          'https://api.spotify.com/v1/me/tracks?limit=50',
          { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        );
        
        if (savedResponse.ok) {
          const savedData = await savedResponse.json();
          profile.savedTracks = savedData.items.map((item: any) => ({
            ...item.track,
            addedAt: item.added_at,
            source: 'Spotify'
          }));
          profile.dataPoints! += savedData.items.length;
          console.log(`✅ Got ${savedData.items.length} saved tracks`);
        }

        // 1.5 Following Artists
        const followingResponse = await fetch(
          'https://api.spotify.com/v1/me/following?type=artist&limit=50',
          { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        );
        
        if (followingResponse.ok) {
          const followingData = await followingResponse.json();
          profile.followedArtists = followingData.artists.items.map((artist: any) => ({
            ...artist,
            source: 'Spotify'
          }));
          profile.dataPoints! += followingData.artists.items.length;
          console.log(`✅ Got ${followingData.artists.items.length} followed artists`);
        }

        // 1.6 User Playlists
        const playlistsResponse = await fetch(
          'https://api.spotify.com/v1/me/playlists?limit=50',
          { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
        );
        
        if (playlistsResponse.ok) {
          const playlistsData = await playlistsResponse.json();
          profile.playlists = playlistsData.items.map((playlist: any) => ({
            id: playlist.id,
            name: playlist.name,
            tracksCount: playlist.tracks.total,
            public: playlist.public,
            collaborative: playlist.collaborative,
            source: 'Spotify'
          }));
          console.log(`✅ Got ${playlistsData.items.length} playlists`);
        }

        // 1.7 Audio Features для всех треков
        const allTracksForFeatures = [
          ...profile.topTracks!.slice(0, 100),
          ...profile.savedTracks!.slice(0, 50),
          ...profile.recentTracks!.slice(0, 50)
        ];
        
        const trackIds = [...new Set(allTracksForFeatures
          .filter(t => t.id)
          .map(t => t.id))]
          .slice(0, 100);
        
        if (trackIds.length > 0) {
          // Spotify API позволяет максимум 100 треков за раз
          const featuresResponse = await fetch(
            `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`,
            { headers: { 'Authorization': `Bearer ${spotifyToken}` } }
          );
          
          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            const audioFeatures = featuresData.audio_features.filter((f: any) => f !== null);
            
            // Вычисляем средние значения для mood profile
            profile.moodProfile = calculateMoodProfile(audioFeatures);
            profile.energyLevel = profile.moodProfile.energy * 100;
            
            console.log(`✅ Analyzed audio features for ${audioFeatures.length} tracks`);
          }
        }

        profile.sources!.push('Spotify');
      } catch (error) {
        console.error('❌ Error fetching Spotify data:', error);
      }
    }

    // ===========================================
    // 2. LAST.FM - РАСШИРЕННЫЙ СБОР
    // ===========================================
    if (lastfmUsername) {
      console.log('📻 Fetching comprehensive Last.fm data...');
      
      try {
        const apiKey = process.env.LASTFM_API_KEY!;
        
        // 2.1 Top Tracks разных периодов
        const periods = ['7day', '1month', '3month', '6month', '12month', 'overall'];
        const lastfmTracks: any[] = [];
        
        for (const period of periods) {
          const url = `https://ws.audioscrobbler.com/2.0/?method=user.getTopTracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=50&period=${period}`;
          const response = await fetch(url);
          
          if (response.ok) {
            const data = await response.json();
            if (data.toptracks?.track) {
              data.toptracks.track.forEach((track: any) => {
                track.period = period;
                track.source = 'Last.fm';
                lastfmTracks.push(track);
              });
              profile.dataPoints! += data.toptracks.track.length;
            }
          }
        }
        
        // Добавляем уникальные треки
        const uniqueLastfmTracks = deduplicateLastfmTracks(lastfmTracks);
        profile.topTracks!.push(...uniqueLastfmTracks.slice(0, 50));
        console.log(`✅ Got ${uniqueLastfmTracks.length} unique tracks from Last.fm`);

        // 2.2 Loved Tracks
        const lovedUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getLovedTracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=50`;
        const lovedResponse = await fetch(lovedUrl);
        
        if (lovedResponse.ok) {
          const lovedData = await lovedResponse.json();
          if (lovedData.lovedtracks?.track) {
            const lovedTracks = lovedData.lovedtracks.track.map((track: any) => ({
              ...track,
              loved: true,
              source: 'Last.fm'
            }));
            profile.savedTracks!.push(...lovedTracks);
            profile.dataPoints! += lovedTracks.length;
            console.log(`✅ Got ${lovedTracks.length} loved tracks from Last.fm`);
          }
        }

        // 2.3 Recent Tracks с timestamp для анализа паттернов
        const recentUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getRecentTracks&user=${lastfmUsername}&api_key=${apiKey}&format=json&limit=200&extended=1`;
        const recentResponse = await fetch(recentUrl);
        
        if (recentResponse.ok) {
          const recentData = await recentResponse.json();
          if (recentData.recenttracks?.track) {
            const recentLastfm = recentData.recenttracks.track
              .filter((t: any) => t.date)
              .map((track: any) => ({
                ...track,
                playedAt: new Date(parseInt(track.date.uts) * 1000),
                source: 'Last.fm'
              }));
            
            profile.recentTracks!.push(...recentLastfm);
            profile.dataPoints! += recentLastfm.length;
            
            // Анализируем временные паттерны
            profile.listeningPatterns = analyzeTimePatterns(recentLastfm);
            console.log(`✅ Analyzed ${recentLastfm.length} recent tracks for patterns`);
          }
        }

        // 2.4 Weekly Artist Chart
        const weeklyUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getWeeklyArtistChart&user=${lastfmUsername}&api_key=${apiKey}&format=json`;
        const weeklyResponse = await fetch(weeklyUrl);
        
        if (weeklyResponse.ok) {
          const weeklyData = await weeklyResponse.json();
          if (weeklyData.weeklyartistchart?.artist) {
            console.log(`✅ Got weekly artist chart from Last.fm`);
          }
        }

        profile.sources!.push('Last.fm');
      } catch (error) {
        console.error('❌ Error fetching Last.fm data:', error);
      }
    }

    // ===========================================
    // 3. APPLE MUSIC - ОБРАБОТКА БИБЛИОТЕКИ
    // ===========================================
    if (appleLibrary) {
      console.log('🍎 Processing Apple Music library...');
      
      try {
        // Обрабатываем всю библиотеку
        if (appleLibrary.songs && Array.isArray(appleLibrary.songs)) {
          const appleTracks = appleLibrary.songs.map((song: any) => ({
            name: song.attributes?.name || song.name,
            artist: song.attributes?.artistName,
            album: song.attributes?.albumName,
            duration: song.attributes?.durationInMillis,
            releaseDate: song.attributes?.releaseDate,
            genre: song.attributes?.genreNames?.[0],
            source: 'Apple Music'
          }));
          
          profile.savedTracks!.push(...appleTracks);
          profile.dataPoints! += appleTracks.length;
          
          // Извлекаем жанры
          const appleGenres = appleTracks
            .map(t => t.genre)
            .filter(g => g);
          profile.topGenres!.push(...appleGenres);
          
          console.log(`✅ Processed ${appleTracks.length} tracks from Apple Music`);
        }

        // Обрабатываем плейлисты
        if (appleLibrary.playlists && Array.isArray(appleLibrary.playlists)) {
          const applePlaylists = appleLibrary.playlists.map((playlist: any) => ({
            name: playlist.attributes?.name || playlist.name,
            tracksCount: playlist.attributes?.trackCount || 0,
            source: 'Apple Music'
          }));
          
          profile.playlists!.push(...applePlaylists);
          console.log(`✅ Got ${applePlaylists.length} playlists from Apple Music`);
        }

        profile.sources!.push('Apple Music');
      } catch (error) {
        console.error('❌ Error processing Apple Music data:', error);
      }
    }

    // ===========================================
    // 4. ПРОДВИНУТЫЙ АНАЛИЗ ДАННЫХ
    // ===========================================
    
    // 4.1 Обработка жанров
    profile.topGenres = processGenresAdvanced(profile.topGenres!);
    
    // 4.2 Вычисление разнообразия
    profile.diversityScore = calculateAdvancedDiversity(
      profile.topGenres!,
      profile.topArtists!,
      profile.topTracks!
    );
    
    // 4.3 Генерация личности
    profile.musicPersonality = generateAdvancedPersonality(
      profile.topGenres!,
      profile.moodProfile!,
      profile.diversityScore!,
      profile.listeningPatterns!,
      profile.sources!
    );
    
    // 4.4 Статистика
    profile.stats = calculateStats(profile);
    
    // 4.5 Финальная обработка
    profile.analyzedAt = new Date();
    
    console.log('✅ Enhanced analysis complete:', {
      personality: profile.musicPersonality,
      dataPoints: profile.dataPoints,
      sources: profile.sources
    });

    return NextResponse.json({
      success: true,
      profile,
      enhanced: true
    });

  } catch (error) {
    console.error('❌ Enhanced analysis error:', error);
    return NextResponse.json({
      success: false,
      error: 'Analysis failed',
      fallback: getDemoProfile()
    }, { status: 500 });
  }
}

// ===========================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ===========================================

function deduplicateTracks(tracks: any[]): any[] {
  const seen = new Map();
  
  tracks.forEach(track => {
    const key = `${track.name}-${track.artists?.[0]?.name || ''}`;
    if (!seen.has(key) || track.popularity > seen.get(key).popularity) {
      seen.set(key, track);
    }
  });
  
  return Array.from(seen.values())
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function deduplicateArtists(artists: any[]): any[] {
  const seen = new Map();
  
  artists.forEach(artist => {
    if (!seen.has(artist.name) || artist.popularity > seen.get(artist.name).popularity) {
      seen.set(artist.name, artist);
    }
  });
  
  return Array.from(seen.values())
    .sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
}

function deduplicateLastfmTracks(tracks: any[]): any[] {
  const seen = new Map();
  
  tracks.forEach(track => {
    const key = `${track.name}-${track.artist?.name || track.artist?.['#text'] || ''}`;
    const playcount = parseInt(track.playcount) || 0;
    
    if (!seen.has(key) || playcount > seen.get(key).playcount) {
      seen.set(key, { ...track, playcount });
    }
  });
  
  return Array.from(seen.values())
    .sort((a, b) => b.playcount - a.playcount);
}

function calculateMoodProfile(audioFeatures: any[]): any {
  if (!audioFeatures || audioFeatures.length === 0) {
    return {
      happiness: 0.5,
      energy: 0.5,
      danceability: 0.5,
      acousticness: 0.3,
      valence: 0.5
    };
  }
  
  const sum = audioFeatures.reduce((acc, f) => ({
    energy: acc.energy + (f.energy || 0),
    danceability: acc.danceability + (f.danceability || 0),
    valence: acc.valence + (f.valence || 0),
    acousticness: acc.acousticness + (f.acousticness || 0),
    speechiness: acc.speechiness + (f.speechiness || 0),
    instrumentalness: acc.instrumentalness + (f.instrumentalness || 0),
    liveness: acc.liveness + (f.liveness || 0)
  }), {
    energy: 0,
    danceability: 0,
    valence: 0,
    acousticness: 0,
    speechiness: 0,
    instrumentalness: 0,
    liveness: 0
  });
  
  const count = audioFeatures.length;
  
  return {
    happiness: sum.valence / count,
    energy: sum.energy / count,
    danceability: sum.danceability / count,
    acousticness: sum.acousticness / count,
    valence: sum.valence / count
  };
}

function analyzeTimePatterns(recentTracks: any[]): any {
  const patterns = {
    morningGenres: [] as string[],
    eveningGenres: [] as string[],
    weekendGenres: [] as string[],
    seasonalTrends: [] as any[]
  };
  
  // Анализ по времени суток
  const morningTracks = recentTracks.filter(t => {
    const hour = t.playedAt.getHours();
    return hour >= 6 && hour < 12;
  });
  
  const eveningTracks = recentTracks.filter(t => {
    const hour = t.playedAt.getHours();
    return hour >= 18 && hour < 24;
  });
  
  const weekendTracks = recentTracks.filter(t => {
    const day = t.playedAt.getDay();
    return day === 0 || day === 6;
  });
  
  // Здесь можно добавить более сложную логику анализа
  
  return patterns;
}

function processGenresAdvanced(genres: string[]): string[] {
  const genreMap = new Map<string, number>();
  
  genres.forEach(genre => {
    // Нормализация и группировка похожих жанров
    let normalized = genre
      .toLowerCase()
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Группировка похожих жанров
    if (normalized.includes('hip hop') || normalized.includes('rap')) {
      normalized = 'Hip Hop';
    } else if (normalized.includes('electronic') || normalized.includes('edm')) {
      normalized = 'Electronic';
    } else if (normalized.includes('rock')) {
      normalized = normalized.includes('indie') ? 'Indie Rock' : 'Rock';
    } else if (normalized.includes('pop')) {
      normalized = normalized.includes('indie') ? 'Indie Pop' : 'Pop';
    } else if (normalized.includes('r&b') || normalized.includes('soul')) {
      normalized = 'R&B/Soul';
    } else if (normalized.includes('jazz')) {
      normalized = 'Jazz';
    } else if (normalized.includes('classical')) {
      normalized = 'Classical';
    } else if (normalized.includes('metal')) {
      normalized = 'Metal';
    } else if (normalized.includes('punk')) {
      normalized = 'Punk';
    } else if (normalized.includes('country')) {
      normalized = 'Country';
    } else if (normalized.includes('folk')) {
      normalized = 'Folk';
    } else if (normalized.includes('latin')) {
      normalized = 'Latin';
    } else {
      // Капитализация первых букв
      normalized = normalized.replace(/\b\w/g, l => l.toUpperCase());
    }
    
    genreMap.set(normalized, (genreMap.get(normalized) || 0) + 1);
  });
  
  return Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre);
}

function calculateAdvancedDiversity(
  genres: string[],
  artists: any[],
  tracks: any[]
): number {
  // Факторы разнообразия:
  const genreCount = new Set(genres.slice(0, 20)).size;
  const artistCount = new Set(artists.map(a => a.name)).size;
  const decadeSpan = calculateDecadeSpan(tracks);
  const popularityRange = calculatePopularityRange(tracks);
  
  // Веса факторов
  const genreDiversity = Math.min(genreCount / 15, 1) * 30;
  const artistDiversity = Math.min(artistCount / 50, 1) * 30;
  const timeDiversity = Math.min(decadeSpan / 5, 1) * 20;
  const popularityDiversity = popularityRange * 20;
  
  return genreDiversity + artistDiversity + timeDiversity + popularityDiversity;
}

function calculateDecadeSpan(tracks: any[]): number {
  const years = tracks
    .map(t => t.album?.release_date || t.releaseDate)
    .filter(d => d)
    .map(d => new Date(d).getFullYear());
  
  if (years.length === 0) return 1;
  
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);
  
  return Math.ceil((maxYear - minYear) / 10);
}

function calculatePopularityRange(tracks: any[]): number {
  const popularities = tracks
    .map(t => t.popularity)
    .filter(p => p !== undefined);
  
  if (popularities.length === 0) return 0.5;
  
  const min = Math.min(...popularities);
  const max = Math.max(...popularities);
  
  return (max - min) / 100;
}

function generateAdvancedPersonality(
  genres: string[],
  mood: any,
  diversity: number,
  patterns: any,
  sources: string[]
): string {
  // Эмодзи в зависимости от источников
  const sourceEmoji = sources.length > 2 ? '🌐' : 
                      sources.includes('Spotify') ? '🎧' : 
                      sources.includes('Apple Music') ? '🍎' : '📻';
  
  // Анализ основных характеристик
  const isEclectic = diversity > 80;
  const isEnergetic = mood?.energy > 0.7;
  const isHappy = mood?.valence > 0.6;
  const isChill = mood?.energy < 0.4;
  const isDancy = mood?.danceability > 0.7;
  const isAcoustic = mood?.acousticness > 0.6;
  
  // Анализ жанров
  const topGenre = genres[0]?.toLowerCase() || '';
  const hasElectronic = genres.slice(0, 5).some(g => 
    g.toLowerCase().includes('electronic') || 
    g.toLowerCase().includes('techno') ||
    g.toLowerCase().includes('house')
  );
  const hasRock = genres.slice(0, 5).some(g => g.toLowerCase().includes('rock'));
  const hasJazz = genres.slice(0, 5).some(g => g.toLowerCase().includes('jazz'));
  const hasClassical = genres.slice(0, 5).some(g => g.toLowerCase().includes('classical'));
  const hasHipHop = genres.slice(0, 5).some(g => 
    g.toLowerCase().includes('hip') || 
    g.toLowerCase().includes('rap')
  );
  const hasIndie = genres.slice(0, 5).some(g => g.toLowerCase().includes('indie'));
  
  // Генерация личности с приоритетами
  if (isEclectic && diversity > 90) {
    return `Musical Omnivore ${sourceEmoji}`;
  } else if (hasClassical || hasJazz) {
    return `Sophisticated Listener 🎩`;
  } else if (isDancy && hasElectronic) {
    return `Dancefloor Dominator 🕺`;
  } else if (isEnergetic && hasRock) {
    return `Rock Warrior 🎸`;
  } else if (hasHipHop && mood?.energy > 0.6) {
    return `Beat Maestro 🎤`;
  } else if (hasIndie && diversity > 70) {
    return `Indie Explorer 🎭`;
  } else if (isChill && isAcoustic) {
    return `Zen Master 🧘`;
  } else if (isHappy && mood?.danceability > 0.6) {
    return `Sunshine Groover ☀️`;
  } else if (hasElectronic) {
    return `Electronic Voyager 🎛️`;
  } else if (diversity > 75) {
    return `Eclectic Explorer ${sourceEmoji}`;
  } else if (isEnergetic) {
    return `Energy Enthusiast ⚡`;
  } else if (isChill) {
    return `Chill Curator 😌`;
  } else {
    return `Music Enthusiast ${sourceEmoji}`;
  }
}

function calculateStats(profile: any): any {
  const allTracks = [
    ...profile.topTracks || [],
    ...profile.savedTracks || [],
    ...profile.recentTracks || []
  ];
  
  const uniqueArtists = new Set([
    ...profile.topArtists?.map((a: any) => a.name) || [],
    ...allTracks.map((t: any) => t.artist || t.artists?.[0]?.name).filter(Boolean)
  ]);
  
  const avgPopularity = allTracks
    .map((t: any) => t.popularity)
    .filter((p: any) => p !== undefined)
    .reduce((sum: number, p: number, i: number, arr: number[]) => 
      i === arr.length - 1 ? (sum + p) / arr.length : sum + p, 0);
  
  // Анализ времени прослушивания
  const listeningHours = profile.recentTracks
    ?.map((t: any) => new Date(t.playedAt).getHours())
    .filter(Boolean) || [];
  
  const hourCounts = listeningHours.reduce((acc: any, hour: number) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});
  
  const mostActiveHour = Object.entries(hourCounts)
    .sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 0;
  
  return {
    totalTracks: new Set(allTracks.map((t: any) => 
      `${t.name}-${t.artist || t.artists?.[0]?.name}`
    )).size,
    totalArtists: uniqueArtists.size,
    totalGenres: new Set(profile.topGenres).size,
    avgPopularity: Math.round(avgPopularity),
    avgTrackAge: 0, // TODO: Calculate average track age
    mostActiveHour: parseInt(mostActiveHour),
    mostActiveDay: 'Friday' // TODO: Calculate from data
  };
}

function getDemoProfile() {
  return {
    topGenres: ["Electronic", "Indie Rock", "Hip Hop"],
    musicPersonality: "Music Explorer 🎵",
    energyLevel: 70,
    diversityScore: 75,
    topArtists: [],
    topTracks: [],
    stats: {
      totalTracks: 0,
      totalArtists: 0,
      avgPopularity: 0
    },
    sources: []
  };
}