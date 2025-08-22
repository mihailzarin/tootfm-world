// app/api/music/lastfm/top-tracks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from '@/lib/prisma';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Получаем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in'
      }, { status: 401 });
    }

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        musicServices: {
          where: { service: 'LASTFM' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found'
      }, { status: 404 });
    }

    // Проверяем Last.fm сервис
    const lastfmService = user.musicServices[0];
    
    if (!lastfmService?.lastfmUsername) {
      // Проверяем cookies для обратной совместимости
      const lastfmUsername = request.cookies.get('lastfm_username')?.value;
      
      if (!lastfmUsername) {
        console.log('❌ Last.fm not connected');
        return NextResponse.json({ 
          error: 'Last.fm not connected',
          tracks: []
        }, { status: 401 });
      }
      
      // Сохраняем в БД для будущего использования
      await prisma.musicService.upsert({
        where: {
          userId_service: {
            userId: user.id,
            service: 'LASTFM'
          }
        },
        update: {
          lastfmUsername: lastfmUsername,
          isActive: true,
          lastSynced: new Date()
        },
        create: {
          userId: user.id,
          service: 'LASTFM',
          lastfmUsername: lastfmUsername,
          isActive: true,
          lastSynced: new Date()
        }
      });
      
      return fetchLastfmData(lastfmUsername);
    }

    // Используем username из БД
    return fetchLastfmData(lastfmService.lastfmUsername);

  } catch (error) {
    console.error('❌ Error in Last.fm API:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      tracks: []
    }, { status: 500 });
  }
}

async function fetchLastfmData(username: string) {
  console.log('🎵 Fetching Last.fm data for:', username);
  
  const response = await fetch(
    `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${LASTFM_API_KEY}&format=json&limit=20&period=3month`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch from Last.fm');
  }

  const data = await response.json();
  console.log(`✅ Got ${data.toptracks?.track?.length || 0} tracks from Last.fm`);
  
  return NextResponse.json({ 
    tracks: data.toptracks?.track || []
  });
}