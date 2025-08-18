import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Получаем токены из cookies
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    const lastfmUser = request.cookies.get('lastfm_user')?.value;

    const profileData = {
      topTracks: [],
      topArtists: [],
      topGenres: {},
      musicPersonality: 'Music Lover',
      energyLevel: 0.5,
      diversity: 0.5,
      totalTracks: 0
    };

    // Анализ Spotify
    if (spotifyToken) {
      try {
        // Топ треки
        const topTracksRes = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        if (topTracksRes.ok) {
          const data = await topTracksRes.json();
          profileData.topTracks = data.items.map((track: any) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            preview: track.preview_url,
            image: track.album.images[0]?.url,
            popularity: track.popularity
          }));
        }

        // Топ артисты
        const topArtistsRes = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
          headers: { 'Authorization': `Bearer ${spotifyToken}` }
        });
        
        if (topArtistsRes.ok) {
          const data = await topArtistsRes.json();
          profileData.topArtists = data.items.map((artist: any) => ({
            id: artist.id,
            name: artist.name,
            image: artist.images[0]?.url,
            genres: artist.genres,
            popularity: artist.popularity
          }));

          // Подсчёт жанров
          data.items.forEach((artist: any) => {
            artist.genres.forEach((genre: string) => {
              profileData.topGenres[genre] = (profileData.topGenres[genre] || 0) + 1;
            });
          });
        }
      } catch (error) {
        console.error('Spotify analysis error:', error);
      }
    }

    // Анализ музыкальной личности
    const genreCount = Object.keys(profileData.topGenres).length;
    if (genreCount > 15) {
      profileData.musicPersonality = 'Eclectic Explorer';
      profileData.diversity = 0.85;
    } else if (genreCount > 8) {
      profileData.musicPersonality = 'Genre Mixer';
      profileData.diversity = 0.65;
    } else if (genreCount > 4) {
      profileData.musicPersonality = 'Selective Listener';
      profileData.diversity = 0.45;
    } else {
      profileData.musicPersonality = 'Focused Fan';
      profileData.diversity = 0.25;
    }

    // Расчёт энергии на основе популярности
    if (profileData.topTracks.length > 0) {
      const avgPopularity = profileData.topTracks.reduce((sum, track) => sum + track.popularity, 0) / profileData.topTracks.length;
      profileData.energyLevel = avgPopularity / 100;
    }

    // Сохраняем в базу данных
    await prisma.musicProfile.upsert({
      where: { userId },
      update: {
        topTracks: profileData.topTracks,
        topArtists: profileData.topArtists,
        topGenres: Object.entries(profileData.topGenres)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([genre, count]) => ({ genre, count })),
        musicPersonality: profileData.musicPersonality,
        energyLevel: profileData.energyLevel,
        diversity: profileData.diversity,
        calculatedAt: new Date()
      },
      create: {
        userId,
        topTracks: profileData.topTracks,
        topArtists: profileData.topArtists,
        topGenres: Object.entries(profileData.topGenres)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([genre, count]) => ({ genre, count })),
        musicPersonality: profileData.musicPersonality,
        energyLevel: profileData.energyLevel,
        diversity: profileData.diversity
      }
    });

    return NextResponse.json({
      success: true,
      profile: profileData
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze profile' },
      { status: 500 }
    );
  }
}

// GET endpoint для получения сохранённого профиля
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const profile = await prisma.musicProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to get profile' },
      { status: 500 }
    );
  }
}
