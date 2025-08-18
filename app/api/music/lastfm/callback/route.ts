// app/api/music/lastfm/callback/route.ts
// Обработчик callback от Last.fm с правильным сохранением данных

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET!;
const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;

/**
 * Генерирует MD5 подпись для Last.fm API
 */
function generateApiSig(params: Record<string, string>): string {
  const sortedKeys = Object.keys(params).sort();
  let sigString = '';
  
  for (const key of sortedKeys) {
    if (key !== 'format' && key !== 'callback') {
      sigString += key + params[key];
    }
  }
  
  sigString += LASTFM_API_SECRET;
  return crypto.createHash('md5').update(sigString, 'utf8').digest('hex');
}

/**
 * Получает session key от Last.fm
 */
async function getSessionKey(token: string) {
  try {
    const params: Record<string, string> = {
      method: 'auth.getSession',
      api_key: LASTFM_API_KEY,
      token: token
    };
    
    const apiSig = generateApiSig(params);
    params.api_sig = apiSig;
    params.format = 'json';
    
    const url = new URL('https://ws.audioscrobbler.com/2.0/');
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    console.log('🔗 Requesting Last.fm session...');
    
    const response = await fetch(url.toString());
    const data = await response.json();
    
    if (!response.ok || data.error) {
      console.error('❌ Last.fm API error:', data);
      throw new Error(data.message || 'Failed to get session');
    }
    
    console.log('✅ Session received for user:', data.session?.name);
    
    return {
      sessionKey: data.session.key,
      username: data.session.name
    };
  } catch (error) {
    console.error('❌ Error getting session key:', error);
    throw error;
  }
}

/**
 * GET обработчик для callback от Last.fm
 */
export async function GET(request: NextRequest) {
  console.log('🎵 Last.fm callback received');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      console.error('❌ No token in callback');
      return NextResponse.redirect(
        new URL('/profile?error=lastfm_no_token', request.url)
      );
    }
    
    console.log('🔑 Processing token...');
    
    // Получаем session key от Last.fm
    const { sessionKey, username } = await getSessionKey(token);
    
    // Создаем response с редиректом
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
    const response = NextResponse.redirect(
      new URL('/profile?lastfm=connected&tab=services', baseUrl)
    );
    
    // ВАЖНО: Сохраняем данные Last.fm в cookies правильно
    
    // Session key для API запросов (httpOnly для безопасности)
    response.cookies.set('lastfm_session', sessionKey, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 год
      path: '/'
    });
    
    // Username для отображения в UI
    response.cookies.set('lastfm_username', username, {
      httpOnly: false, // Можем читать на клиенте
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/'
    });
    
    // Сохраняем полные данные пользователя
    const userData = {
      username,
      connected: true,
      connectedAt: new Date().toISOString()
    };
    
    response.cookies.set('lastfm_user', JSON.stringify(userData), {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365,
      path: '/'
    });
    
    console.log('✅ Last.fm connected successfully:', {
      username,
      cookiesSet: ['lastfm_session', 'lastfm_username', 'lastfm_user']
    });
    
    return response;
    
  } catch (error) {
    console.error('❌ Last.fm callback error:', error);
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
    return NextResponse.redirect(
      new URL('/profile?error=lastfm_connection_failed', baseUrl)
    );
  }
}