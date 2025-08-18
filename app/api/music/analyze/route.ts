import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    console.log('Analyzing for user:', userId);
    
    // Получаем Spotify токен из cookies
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    
    // Базовый профиль
    let profileData = {
      musicPersonality: 'Music Explorer',
      energyLevel: 0.75,
      diversity: 0.80,
      topGenres: [
        { genre: 'Electronic', count: 35 },
        { genre: 'Indie Rock', count: 25 },
        { genre: 'Hip-Hop', count: 20 },
        { genre: 'Pop', count: 15 },
        { genre: 'Jazz', count: 5 }
      ],
      topTracks: [],
      topArtists: []
    };

    // Если есть Spotify токен, пробуем получить реальные данные
    if (spotifyToken) {
      try {
        // Получаем топ артистов
        const artistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=20', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        if (artistsRes.ok) {
          const artistsData = await artistsRes.json();
          
          // Собираем жанры из артистов
          const genreCount: Record<string, number> = {};
          artistsData.items.forEach((artist: any) => {
            artist.genres.forEach((genre: string) => {
              genreCount[genre] = (genreCount[genre] || 0) + 1;
            });
          });
          
          // Преобразуем в массив и сортируем
          const sortedGenres = Object.entries(genreCount)
            .map(([genre, count]) => ({ genre, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
          
          if (sortedGenres.length > 0) {
            profileData.topGenres = sortedGenres;
            
            // Определяем личность на основе количества жанров
            const genreVariety = Object.keys(genreCount).length;
            if (genreVariety > 15) {
              profileData.musicPersonality = 'Eclectic Explorer';
              profileData.diversity = 0.90;
            } else if (genreVariety > 10) {
              profileData.musicPersonality = 'Genre Adventurer';
              profileData.diversity = 0.75;
            } else if (genreVariety > 5) {
              profileData.musicPersonality = 'Balanced Listener';
              profileData.diversity = 0.60;
            } else {
              profileData.musicPersonality = 'Focused Enthusiast';
              profileData.diversity = 0.40;
            }
          }
          
          profileData.topArtists = artistsData.items.slice(0, 10);
        }
        
        // Получаем топ треки
        const tracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=20', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        if (tracksRes.ok) {
          const tracksData = await tracksRes.json();
          profileData.topTracks = tracksData.items.slice(0, 10);
          
          // Рассчитываем энергию на основе популярности треков
          if (tracksData.items.length > 0) {
            const avgPopularity = tracksData.items.reduce((sum: number, track: any) => 
              sum + track.popularity, 0) / tracksData.items.length;
            profileData.energyLevel = avgPopularity / 100;
          }
        }
      } catch (spotifyError) {
        console.error('Spotify API error:', spotifyError);
        // Используем демо данные если Spotify не работает
      }
    }

    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Analysis error:', error);
    
    // Возвращаем демо данные при любой ошибке
    return NextResponse.json({
      success: true,
      profile: {
        musicPersonality: 'Music Lover',
        energyLevel: 0.70,
        diversity: 0.75,
        topGenres: [
          { genre: 'Pop', count: 30 },
          { genre: 'Rock', count: 25 },
          { genre: 'Electronic', count: 20 },
          { genre: 'Hip-Hop', count: 15 },
          { genre: 'Jazz', count: 10 }
        ],
        topTracks: [],
        topArtists: []
      }
    });
  }
}

// GET метод для тестирования
export async function GET() {
  return NextResponse.json({
    success: true,
    profile: {
      musicPersonality: 'Demo User',
      energyLevel: 0.75,
      diversity: 0.85,
      topGenres: [
        { genre: 'Electronic', count: 35 },
        { genre: 'Indie Rock', count: 25 },
        { genre: 'Hip-Hop', count: 20 },
        { genre: 'Pop', count: 15 },
        { genre: 'Jazz', count: 5 }
      ],
      topTracks: [],
      topArtists: []
    }
  });
}
