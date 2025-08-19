// app/api/spotify/token/route.ts
// Endpoint для безопасного получения токена для Web Playback SDK

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Получаем токен из httpOnly cookie
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    const spotifyExpires = request.cookies.get('spotify_expires')?.value;
    const spotifyRefresh = request.cookies.get('spotify_refresh')?.value;
    
    if (!spotifyToken) {
      return NextResponse.json({
        error: 'No Spotify token found',
        requiresAuth: true
      }, { status: 401 });
    }
    
    // Проверяем, не истек ли токен
    if (spotifyExpires) {
      const expiresAt = new Date(spotifyExpires);
      const now = new Date();
      const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60);
      
      // Если токен истекает в ближайшие 5 минут, обновляем его
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
          
          // Создаем response с новым токеном
          const response = NextResponse.json({
            token: data.access_token,
            expiresIn: data.expires_in
          });
          
          // Обновляем cookies
          response.cookies.set('spotify_token', data.access_token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: data.expires_in || 3600
          });
          
          const newExpiresAt = new Date(Date.now() + (data.expires_in * 1000));
          response.cookies.set('spotify_expires', newExpiresAt.toISOString(), {
            httpOnly: false,
            secure: true,
            sameSite: 'lax',
            maxAge: data.expires_in || 3600
          });
          
          if (data.refresh_token) {
            response.cookies.set('spotify_refresh', data.refresh_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 365
            });
          }
          
          console.log('✅ Token refreshed successfully');
          return response;
        }
      }
    }
    
    // Возвращаем текущий токен
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