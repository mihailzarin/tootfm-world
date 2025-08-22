import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('❌ No session found');
      return NextResponse.json({ 
        error: 'Unauthorized - Please sign in'
      }, { status: 401 });
    }

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

    const lastfmService = user.musicServices[0];
    
    if (!lastfmService?.lastfmUsername) {
      const lastfmUsername = request.cookies.get('lastfm_username')?.value;
      
      if (!lastfmUsername) {
        console.log('❌ Last.fm not connected');
        return NextResponse.json({ 
          error: 'Last.fm not connected',
          tracks: []
        }, { status: 401 });
      }
      
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
  
  if (!LASTFM_API_KEY) {
    console.error('❌ LASTFM_API_KEY not found');
    return NextResponse.json({ 
      error: 'Last.fm API key not configured',
      tracks: []
    }, { status: 500 });
  }
  
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