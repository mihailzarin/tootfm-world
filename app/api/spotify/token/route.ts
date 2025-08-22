// app/api/spotify/token/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AUTH_CONFIG, getCookieOptions } from '@/lib/auth/config';

export async function GET(request: NextRequest) {
  try {
    // Get tokens from cookies using centralized names
    const spotifyToken = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN)?.value;
    const spotifyExpires = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES)?.value;
    const spotifyRefresh = request.cookies.get(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH)?.value;
    
    if (!spotifyToken) {
      return NextResponse.json({
        error: 'No Spotify token found',
        requiresAuth: true
      }, { status: 401 });
    }
    
    // Check if token is expiring soon
    if (spotifyExpires) {
      const expiresAt = new Date(spotifyExpires);
      const now = new Date();
      const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
      
      // Refresh token if it expires in the next 5 minutes
      if (minutesLeft < 5 && spotifyRefresh) {
        console.log('🔄 Token expiring soon, auto-refreshing...');
        
        const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
        const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
        
        const refreshResponse = await fetch('https://accounts.spotify.com/api/token', {
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
        
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          
          // Create response with new token
          const response = NextResponse.json({
            token: data.access_token,
            expiresIn: data.expires_in
          });
          
          // Update cookies with new token
          response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN, data.access_token, {
            ...getCookieOptions(true),
            maxAge: data.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
          });
          
          const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
          response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES, newExpiresAt.toISOString(), {
            ...getCookieOptions(false),
            maxAge: data.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
          });
          
          if (data.refresh_token) {
            response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH, data.refresh_token, {
              ...getCookieOptions(true),
              maxAge: AUTH_CONFIG.EXPIRATION.REFRESH_TOKEN
            });
          }
          
          console.log('✅ Token refreshed successfully');
          return response;
        } else {
          console.error('❌ Failed to refresh token');
          return NextResponse.json({
            error: 'Token refresh failed',
            requiresAuth: true
          }, { status: 401 });
        }
      }
    }
    
    // Return current token
    return NextResponse.json({
      token: spotifyToken,
      expiresAt: spotifyExpires || null
    });
    
  } catch (error) {
    console.error('❌ Error getting token:', error);
    return NextResponse.json({
      error: 'Failed to get token'
    }, { status: 500 });
  }
}