// app/api/music/analyze/route.ts

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    console.log('Analyzing music for user:', userId);

    // Получаем токен Spotify из куки
    const cookieHeader = request.headers.get('cookie');
    const spotifyToken = cookieHeader
      ?.split('; ')
      .find(row => row.startsWith('spotify_token='))
      ?.split('=')[1];

    let topTracks = [];
    let topArtists = [];
    let audioFeatures = null;

    if (spotifyToken) {
      try {
        // Получаем топ треки пользователя
        const tracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });

        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json();
          topTracks = tracksData.items || [];
        }

        // Получаем топ артистов
        const artistsResponse = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
          headers: {
            'Authorization': `Bearer ${spotifyToken}`
          }
        });

        if (artistsResponse.ok) {
          const artistsData = await artistsResponse.json();
          topArtists = artistsData.items || [];
        }

        // Получаем audio features для анализа энергии
        if (topTracks.length > 0) {
          const trackIds = topTracks.slice(0, 10).map((t: any) => t.id).join(',');
          const featuresResponse = await fetch(`https://api.spotify.com/v1/audio-features?ids=${trackIds}`, {
            headers: {
              'Authorization': `Bearer ${spotifyToken}`
            }
          });

          if (featuresResponse.ok) {
            const featuresData = await featuresResponse.json();
            audioFeatures = featuresData.audio_features;
          }
        }
      } catch (error) {
        console.error('Error fetching Spotify data:', error);
      }
    }

    // Анализируем данные
    const genres = extractGenres(topArtists, topTracks);
    const energyLevel = calculateEnergy(audioFeatures);
    const diversityScore = calculateDiversity(genres, topArtists);
    const musicPersonality = generatePersonality(genres, energyLevel, diversityScore);

    const profile = {
      topGenres: genres.slice(0, 6),
      musicPersonality,
      energyLevel: Math.round(energyLevel),
      diversityScore: Math.round(diversityScore),
      topArtists: topArtists.slice(0, 5).map((a: any) => ({
        name: a.name,
        image: a.images?.[0]?.url,
        popularity: a.popularity
      })),
      topTracks: topTracks.slice(0, 5).map((t: any) => ({
        name: t.name,
        artist: t.artists?.[0]?.name,
        album: t.album?.name,
        image: t.album?.images?.[0]?.url
      })),
      stats: {
        totalTracks: topTracks.length,
        totalArtists: topArtists.length,
        avgPopularity: topTracks.length > 0 
          ? Math.round(topTracks.reduce((acc: number, t: any) => acc + t.popularity, 0) / topTracks.length)
          : 50
      }
    };

    return NextResponse.json({ 
      success: true, 
      profile 
    });

  } catch (error) {
    console.error('Music analysis error:', error);
    
    // Возвращаем демо данные при ошибке
    return NextResponse.json({
      success: true,
      profile: {
        topGenres: ["Electronic", "Indie Rock", "Hip-Hop", "Pop", "Jazz"],
        musicPersonality: "Eclectic Explorer",
        energyLevel: 75,
        diversityScore: 85,
        topArtists: [
          { name: "Daft Punk", popularity: 85 },
          { name: "Radiohead", popularity: 82 },
          { name: "Kendrick Lamar", popularity: 88 },
          { name: "Tame Impala", popularity: 79 },
          { name: "FKA twigs", popularity: 71 }
        ],
        topTracks: [
          { name: "Get Lucky", artist: "Daft Punk", album: "Random Access Memories" },
          { name: "Karma Police", artist: "Radiohead", album: "OK Computer" },
          { name: "HUMBLE.", artist: "Kendrick Lamar", album: "DAMN." },
          { name: "Elephant", artist: "Tame Impala", album: "Lonerism" },
          { name: "Two Weeks", artist: "FKA twigs", album: "LP1" }
        ],
        stats: {
          totalTracks: 20,
          totalArtists: 10,
          avgPopularity: 78
        }
      }
    });
  }
}

function extractGenres(artists: any[], tracks: any[]): string[] {
  const genreMap = new Map<string, number>();
  
  // Собираем жанры от артистов
  artists.forEach((artist: any) => {
    artist.genres?.forEach((genre: string) => {
      genreMap.set(genre, (genreMap.get(genre) || 0) + 1);
    });
  });

  // Если нет жанров, используем базовые
  if (genreMap.size === 0) {
    return ["Pop", "Rock", "Electronic", "Hip-Hop", "Indie"];
  }

  // Сортируем по популярности
  return Array.from(genreMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .map(genre => {
      // Упрощаем названия жанров
      return genre
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .replace(/^Alt /, 'Alternative ')
        .replace(/^Edm$/, 'EDM')
        .replace(/^Uk /, 'UK ')
        .replace(/^Us /, 'US ');
    });
}

function calculateEnergy(audioFeatures: any): number {
  if (!audioFeatures || audioFeatures.length === 0) {
    return 70; // Дефолтное значение
  }

  const avgEnergy = audioFeatures.reduce((acc: number, f: any) => {
    return acc + (f?.energy || 0.5);
  }, 0) / audioFeatures.length;

  const avgDanceability = audioFeatures.reduce((acc: number, f: any) => {
    return acc + (f?.danceability || 0.5);
  }, 0) / audioFeatures.length;

  // Комбинируем energy и danceability для общего показателя
  return ((avgEnergy * 0.6 + avgDanceability * 0.4) * 100);
}

function calculateDiversity(genres: string[], artists: any[]): number {
  // Базовая формула: количество уникальных жанров / максимум * 100
  const uniqueGenres = new Set(genres);
  const genreDiversity = Math.min(uniqueGenres.size / 10, 1) * 60;
  
  // Добавляем разнообразие по популярности артистов
  if (artists.length > 0) {
    const popularities = artists.map((a: any) => a.popularity || 50);
    const avgPopularity = popularities.reduce((a: number, b: number) => a + b, 0) / popularities.length;
    const variance = popularities.reduce((acc: number, p: number) => {
      return acc + Math.pow(p - avgPopularity, 2);
    }, 0) / popularities.length;
    const stdDev = Math.sqrt(variance);
    
    // Больше разброс = больше разнообразие
    const popularityDiversity = Math.min(stdDev / 20, 1) * 40;
    
    return genreDiversity + popularityDiversity;
  }
  
  return genreDiversity + 20;
}

function generatePersonality(genres: string[], energy: number, diversity: number): string {
  // Генерируем персональность на основе данных
  if (diversity > 80 && genres.length > 4) {
    return "Eclectic Explorer 🌍";
  } else if (energy > 75) {
    return "Energy Enthusiast ⚡";
  } else if (genres.includes("Jazz") || genres.includes("Classical")) {
    return "Sophisticated Listener 🎩";
  } else if (genres.some(g => g.includes("Indie") || g.includes("Alternative"))) {
    return "Indie Connoisseur 🎸";
  } else if (genres.some(g => g.includes("Electronic") || g.includes("EDM"))) {
    return "Electronic Voyager 🎛️";
  } else if (genres.some(g => g.includes("Hip") || g.includes("Rap"))) {
    return "Beat Master 🎤";
  } else if (energy < 40) {
    return "Chill Vibes Curator 😌";
  } else {
    return "Music Enthusiast 🎵";
  }
}