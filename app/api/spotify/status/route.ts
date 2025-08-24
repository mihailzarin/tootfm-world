import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Изменен импорт!
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    // Проверяем сессию
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        connected: false, 
        error: 'Not authenticated' 
      }, { status: 401 });
    }
    
    // Проверяем подключение Spotify в БД
    const spotifyService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY',
        isActive: true
      }
    });
    
    if (!spotifyService || !spotifyService.accessToken) {
      return NextResponse.json({ 
        connected: false 
      });
    }
    
    // Проверяем не истек ли токен
    if (spotifyService.tokenExpiry && spotifyService.tokenExpiry < new Date()) {
      // Токен истек, нужно обновить
      // TODO: Implement token refresh
      return NextResponse.json({ 
        connected: false,
        needsRefresh: true 
      });
    }
    
    // Получаем профиль пользователя Spotify
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${spotifyService.accessToken}`
        }
      });
      
      if (!response.ok) {
        return NextResponse.json({ 
          connected: false,
          needsReconnect: true 
        });
      }
      
      const profile = await response.json();
      
      return NextResponse.json({
        connected: true,
        user: {
          id: profile.id,
          display_name: profile.display_name,
          email: profile.email,
          images: profile.images,
          product: profile.product
        }
      });
      
    } catch (error) {
      console.error('Error fetching Spotify profile:', error);
      return NextResponse.json({ 
        connected: false,
        error: 'Failed to fetch profile' 
      });
    }
    
  } catch (error) {
    console.error('Error checking Spotify status:', error);
    return NextResponse.json({ 
      connected: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}