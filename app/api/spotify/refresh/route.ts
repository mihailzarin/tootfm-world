// app/api/spotify/refresh/route.ts
// Endpoint для обновления Spotify токена

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Refreshing Spotify token...');
    
    // Получаем refresh token из cookies
    const refreshToken = request.cookies.get('spotify_refresh')?.value;
    
    if (!refreshToken) {
      console.error('❌ No refresh token found');
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }
    
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    
    // Запрашиваем новый токен
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to refresh token:', error);
      return NextResponse.json(
        { error: 'Failed to refresh token' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    console.log('✅ New token received, expires in:', data.expires_in);
    
    // Создаем response
    const res = NextResponse.json({
      success: true,
      expiresIn: data.expires_in
    });
    
    // Обновляем access token
    res.cookies.set('spotify_token', data.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: data.expires_in || 3600,
      path: '/'
    });
    
    // Обновляем время истечения
    const expiresAt = new Date(Date.now() + (data.expires_in * 1000));
    res.cookies.set('spotify_expires', expiresAt.toISOString(), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: data.expires_in || 3600,
      path: '/'
    });
    
    // Если пришел новый refresh token, обновляем и его
    if (data.refresh_token) {
      res.cookies.set('spotify_refresh', data.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
        path: '/'
      });
    }
    
    console.log('✅ Token refreshed successfully');
    return res;
    
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET метод для проверки статуса токена
export async function GET(request: NextRequest) {
  try {
    const expiresAt = request.cookies.get('spotify_expires')?.value;
    const hasToken = request.cookies.get('spotify_token')?.value;
    const hasRefresh = request.cookies.get('spotify_refresh')?.value;
    
    if (!hasToken) {
      return NextResponse.json({
        valid: false,
        reason: 'No token'
      });
    }
    
    if (!expiresAt) {
      return NextResponse.json({
        valid: false,
        reason: 'No expiry date'
      });
    }
    
    const expires = new Date(expiresAt);
    const now = new Date();
    const minutesLeft = Math.floor((expires.getTime() - now.getTime()) / 1000 / 60);
    
    return NextResponse.json({
      valid: expires > now,
      expiresAt: expiresAt,
      minutesLeft: minutesLeft,
      canRefresh: !!hasRefresh
    });
    
  } catch (error) {
    return NextResponse.json({
      valid: false,
      error: 'Failed to check token'
    });
  }
}