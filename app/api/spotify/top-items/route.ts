import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function refreshSpotifyToken(refreshToken: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64')
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[Spotify] Refresh token error:', error);
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  try {
    console.log('[Spotify API] Starting request...');
    
    const session = await getServerSession(authOptions);
    console.log('[Spotify API] Session:', session?.user?.id ? 'Found' : 'Not found');
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Используем findFirst вместо findUnique
    const musicService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY'
      }
    });

    console.log('[Spotify API] MusicService:', musicService ? 'Found' : 'Not found');

    if (!musicService || !musicService.accessToken) {
      return NextResponse.json({ error: 'Spotify not connected' }, { status: 401 });
    }

    let accessToken = musicService.accessToken;
    
    if (musicService.tokenExpiry && new Date() > musicService.tokenExpiry) {
      console.log('[Spotify API] Token expired, refreshing...');
      
      if (!musicService.refreshToken) {
        return NextResponse.json({ error: 'No refresh token available' }, { status: 401 });
      }

      try {
        const newTokens = await refreshSpotifyToken(musicService.refreshToken);
        
        await prisma.musicService.update({
          where: { id: musicService.id },
          data: {
            accessToken: newTokens.access_token,
            tokenExpiry: new Date(Date.now() + newTokens.expires_in * 1000)
          }
        });
        
        accessToken = newTokens.access_token;
        console.log('[Spotify API] Token refreshed successfully');
      } catch (error) {
        console.error('[Spotify API] Token refresh failed:', error);
        return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
      }
    }

    console.log('[Spotify API] Fetching data from Spotify...');

    const [topTracksRes, topArtistsRes] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    console.log('[Spotify API] Response status:', {
      tracks: topTracksRes.status,
      artists: topArtistsRes.status
    });

    if (!topTracksRes.ok || !topArtistsRes.ok) {
      const tracksError = !topTracksRes.ok ? await topTracksRes.text() : null;
      const artistsError = !topArtistsRes.ok ? await topArtistsRes.text() : null;
      console.error('[Spotify API] Request failed:', { tracksError, artistsError });
      return NextResponse.json({ 
        error: 'Failed to fetch Spotify data',
        details: { tracksError, artistsError }
      }, { status: 500 });
    }

    const tracksData = await topTracksRes.json();
    const artistsData = await topArtistsRes.json();

    console.log('[Spotify API] Data received:', {
      tracks: tracksData.items?.length || 0,
      artists: artistsData.items?.length || 0
    });

    const genres: Record<string, number> = {};
    artistsData.items?.forEach((artist: any) => {
      artist.genres?.forEach((genre: string) => {
        genres[genre] = (genres[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genres)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([genre]) => genre);

    const response = {
      tracks: tracksData.items || [],
      artists: artistsData.items || [],
      genres: topGenres,
      connected: true
    };

    console.log('[Spotify API] Returning success');
    return NextResponse.json(response);

  } catch (error) {
    console.error('[Spotify API] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}