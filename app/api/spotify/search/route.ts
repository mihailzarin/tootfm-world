// app/api/spotify/search/route.ts
// API endpoint для поиска треков через Spotify

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json({ 
        tracks: [],
        error: 'Query is required' 
      }, { status: 400 });
    }

    // Получаем токен из cookies
    const spotifyToken = request.cookies.get('spotify_token')?.value;
    
    if (!spotifyToken) {
      console.log('❌ No Spotify token found');
      return NextResponse.json({ 
        error: 'Spotify not connected',
        requiresAuth: true 
      }, { status: 401 });
    }

    console.log(`🔍 Searching Spotify for: "${query}"`);

    // Поиск через Spotify API
    const searchParams = new URLSearchParams({
      q: query,
      type: 'track',
      limit: '20',
      market: 'US'
    });

    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?${searchParams}`,
      {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        }
      }
    );

    if (!searchResponse.ok) {
      if (searchResponse.status === 401) {
        console.log('❌ Spotify token expired');
        
        // Пробуем обновить токен
        const refreshToken = request.cookies.get('spotify_refresh')?.value;
        
        if (refreshToken) {
          console.log('🔄 Attempting to refresh token...');
          
          // Вызываем endpoint обновления токена
          const refreshResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/spotify/refresh`, {
            method: 'POST',
            headers: {
              Cookie: request.headers.get('cookie') || ''
            }
          });
          
          if (refreshResponse.ok) {
            // Получаем новый токен из ответа
            const newTokenData = await refreshResponse.json();
            
            // Повторяем поиск с новым токеном
            const retryResponse = await fetch(
              `https://api.spotify.com/v1/search?${searchParams}`,
              {
                headers: {
                  'Authorization': `Bearer ${newTokenData.access_token}`
                }
              }
            );
            
            if (retryResponse.ok) {
              const retryData = await retryResponse.json();
              
              // Возвращаем результаты с обновленным токеном
              const response = NextResponse.json({
                tracks: retryData.tracks?.items || [],
                total: retryData.tracks?.total || 0
              });
              
              // Устанавливаем новый токен в cookies
              response.cookies.set('spotify_token', newTokenData.access_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 3600
              });
              
              return response;
            }
          }
        }
        
        return NextResponse.json({ 
          error: 'Spotify token expired',
          requiresAuth: true 
        }, { status: 401 });
      }
      
      console.error('❌ Spotify search failed:', searchResponse.status);
      return NextResponse.json({ 
        error: 'Search failed',
        tracks: [] 
      }, { status: searchResponse.status });
    }

    const searchData = await searchResponse.json();
    
    console.log(`✅ Found ${searchData.tracks?.items?.length || 0} tracks`);

    // Форматируем и возвращаем результаты
    return NextResponse.json({
      tracks: searchData.tracks?.items || [],
      total: searchData.tracks?.total || 0,
      next: searchData.tracks?.next || null
    });

  } catch (error) {
    console.error('❌ Search error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      tracks: [] 
    }, { status: 500 });
  }
}
