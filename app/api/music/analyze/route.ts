// app/api/music/analyze/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('🎵 Starting music analysis...');
    
    // Получаем userId из cookies (от Google)
    const userId = request.cookies.get('tootfm_user_id')?.value;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    // Получаем тело запроса с данными анализа
    const body = await request.json();
    const { topTracks, topArtists, topGenres, musicPersonality, energyLevel, diversityScore } = body;

    console.log('📊 Received analysis data:', {
      tracks: topTracks?.length,
      artists: topArtists?.length,
      genres: topGenres?.length
    });

    // Находим или создаём пользователя в БД
    let dbUser = await prisma.user.findUnique({
      where: { worldId: userId }
    });

    if (!dbUser) {
      // Получаем данные из cookie
      const googleUserCookie = request.cookies.get('google_user')?.value;
      let googleUser = null;
      
      if (googleUserCookie) {
        try {
          googleUser = JSON.parse(googleUserCookie);
        } catch (e) {
          console.error('Failed to parse google_user cookie');
        }
      }

      // Создаём пользователя если его нет
      console.log('📝 Creating new user in DB...');
      dbUser = await prisma.user.create({
        data: {
          worldId: userId,
          googleId: userId.replace('google_', ''),
          email: googleUser?.email,
          displayName: googleUser?.name || 'User',
          avatar: googleUser?.picture,
          verified: true
        }
      });
      console.log('✅ User created:', dbUser.id);
    }

    // Сохраняем или обновляем музыкальный профиль
    const musicProfile = await prisma.musicProfile.upsert({
      where: { userId: dbUser.id },
      update: {
        topTracks: JSON.stringify(topTracks || []),
        topArtists: JSON.stringify(topArtists || []),
        topGenres: JSON.stringify(topGenres || []),
        musicPersonality: musicPersonality || null,
        energyLevel: energyLevel || 0.5,
        diversityScore: diversityScore || 0.5,
        calculatedAt: new Date(),
        lastUpdated: new Date()
      },
      create: {
        userId: dbUser.id,
        topTracks: JSON.stringify(topTracks || []),
        topArtists: JSON.stringify(topArtists || []),
        topGenres: JSON.stringify(topGenres || []),
        musicPersonality: musicPersonality || null,
        energyLevel: energyLevel || 0.5,
        diversityScore: diversityScore || 0.5
      }
    });

    console.log('✅ Music profile saved to DB');

    return NextResponse.json({
      success: true,
      profile: {
        id: musicProfile.id,
        topGenres,
        musicPersonality,
        energyLevel,
        diversityScore,
        topArtists: topArtists?.slice(0, 10),
        topTracks: topTracks?.slice(0, 10)
      }
    });

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze music' },
      { status: 500 }
    );
  }
}