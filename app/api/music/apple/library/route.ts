import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateAppleMusicToken } from '@/lib/apple-music/token-generator';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ 
        connected: false,
        tracks: [],
        artists: []
      });
    }

    // Получаем Apple Music сервис из БД
    const musicService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'APPLE',
        isActive: true
      }
    });

    if (!musicService?.appleToken) {
      console.log('Apple Music not connected for user');
      return NextResponse.json({ 
        connected: false,
        tracks: [],
        artists: []
      });
    }

    try {
      // Генерируем developer token
      const developerToken = generateAppleMusicToken();
      
      // Делаем запрос к Apple Music API
      const response = await fetch('https://api.music.apple.com/v1/me/recent/played/tracks?limit=30', {
        headers: {
          'Authorization': `Bearer ${developerToken}`,
          'Music-User-Token': musicService.appleToken
        }
      });

      if (!response.ok) {
        console.error('Apple Music API error:', response.status, response.statusText);
        
        // Если токен невалидный, деактивируем сервис
        if (response.status === 401 || response.status === 403) {
          await prisma.musicService.update({
            where: { id: musicService.id },
            data: { isActive: false }
          });
        }
        
        return NextResponse.json({ 
          connected: false,
          tracks: [],
          artists: [],
          error: 'Failed to fetch Apple Music data'
        });
      }

      const data = await response.json();
      
      // Форматируем треки в единый формат
      const tracks = (data.data || []).map((item: any) => ({
        id: item.id,
        name: item.attributes.name,
        artists: [{ name: item.attributes.artistName }],
        album: {
          name: item.attributes.albumName,
          images: item.attributes.artwork ? [{
            url: item.attributes.artwork.url
              .replace('{w}', '300')
              .replace('{h}', '300')
          }] : []
        }
      }));

      console.log(`✅ Fetched ${tracks.length} tracks from Apple Music`);

      return NextResponse.json({
        connected: true,
        tracks,
        artists: [], // Apple Music API требует отдельный запрос для артистов
        source: 'APPLE'
      });

    } catch (apiError) {
      console.error('Apple Music API error:', apiError);
      return NextResponse.json({ 
        connected: true, // Сервис подключен, но данные не получены
        tracks: [],
        artists: [],
        error: 'API request failed'
      });
    }

  } catch (error) {
    console.error('Apple Music library error:', error);
    return NextResponse.json({ 
      connected: false,
      tracks: [],
      artists: [],
      error: 'Internal server error'
    });
  }
}
