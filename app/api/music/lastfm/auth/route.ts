// app/api/lastfm/auth/route.ts
// Инициирует процесс авторизации Last.fm

import { NextRequest, NextResponse } from 'next/server';

const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
const LASTFM_CALLBACK_URL = process.env.LASTFM_CALLBACK_URL || 'http://localhost:3001/api/lastfm/callback';

/**
 * GET обработчик для начала авторизации Last.fm
 * Редиректит пользователя на страницу авторизации Last.fm
 */
export async function GET(request: NextRequest) {
  console.log('🚀 Starting Last.fm authorization');
  
  try {
    // Проверяем наличие API ключа
    if (!LASTFM_API_KEY) {
      console.error('❌ LASTFM_API_KEY not configured');
      return NextResponse.json(
        { error: 'Last.fm not configured' },
        { status: 500 }
      );
    }
    
    // Формируем URL для авторизации Last.fm
    const authUrl = new URL('https://www.last.fm/api/auth/');
    authUrl.searchParams.append('api_key', LASTFM_API_KEY);
    authUrl.searchParams.append('cb', LASTFM_CALLBACK_URL);
    
    console.log('🔗 Redirecting to Last.fm:', authUrl.toString());
    
    // Редиректим пользователя на Last.fm
    return NextResponse.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('❌ Last.fm auth error:', error);
    return NextResponse.json(
      { error: 'Failed to start authorization' },
      { status: 500 }
    );
  }
}

/**
 * DELETE обработчик для отключения Last.fm
 * Альтернативный способ отключить интеграцию
 */
export async function DELETE(request: NextRequest) {
  try {
    // TODO: Удалить данные Last.fm из базы
    // Пока просто удаляем cookies
    
    const response = NextResponse.json({ 
      success: true,
      message: 'Last.fm disconnected' 
    });
    
    response.cookies.delete('lastfm_session');
    response.cookies.delete('lastfm_username');
    
    console.log('✅ Last.fm disconnected');
    
    return response;
  } catch (error) {
    console.error('❌ Error disconnecting Last.fm:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect' },
      { status: 500 }
    );
  }
}