// app/api/spotify/refresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG, getCookieOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    const spotifyToken = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN)?.value;
    const spotifyExpires = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES)?.value;
    const spotifyRefresh = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH)?.value;
    
    if (!spotifyToken) {
      return NextResponse.json({
        valid: false,
        canRefresh: false,
        minutesLeft: 0
      });
    }
    
    if (spotifyExpires) {
      const expiresAt = new Date(spotifyExpires);
      const now = new Date();
      const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
      
      return NextResponse.json({
        valid: minutesLeft > 0,
        canRefresh: !!spotifyRefresh,
        minutesLeft: Math.max(0, minutesLeft)
      });
    }
    
    return NextResponse.json({
      valid: true,
      canRefresh: !!spotifyRefresh,
      minutesLeft: 60 // Assume 1 hour if no expiration
    });
  } catch (error) {
    console.error('❌ Token validation error:', error);
    return NextResponse.json({
      valid: false,
      canRefresh: false,
      minutesLeft: 0
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Refreshing Spotify token...');
    
    const spotifyRefresh = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH)?.value;
    
    if (!spotifyRefresh) {
      console.error('❌ No refresh token found');
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }
    
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: spotifyRefresh
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to refresh token:', error);
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: 400 }
      );
    }
    
    const data = await response.json();
    console.log('✅ New token received, expires in:', data.expires_in);
    
    // Create response with new token
    const responseObj = NextResponse.json({
      success: true,
      expiresIn: data.expires_in
    });
    
    // Update cookies
    responseObj.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN, data.access_token, {
      ...getCookieOptions(true),
      maxAge: data.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
    });
    
    const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
    responseObj.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES, newExpiresAt.toISOString(), {
      ...getCookieOptions(false),
      maxAge: data.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
    });
    
    if (data.refresh_token) {
      responseObj.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH, data.refresh_token, {
        ...getCookieOptions(true),
        maxAge: AUTH_CONFIG.EXPIRATION.REFRESH_TOKEN
      });
    }
    
    console.log('✅ Token refreshed successfully');
    return responseObj;
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}