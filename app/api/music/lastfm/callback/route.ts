// app/api/music/lastfm/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('Last.fm callback started');
  
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    console.error('No token in callback');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=no_token`);
  }

  const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
  const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET;
  
  if (!LASTFM_API_KEY || !LASTFM_API_SECRET) {
    console.error('Last.fm credentials not configured');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=not_configured`);
  }
  
  try {
    console.log('Processing Last.fm callback with token:', token);
    
    // Используем встроенный crypto модуль Node.js
    const crypto = require('crypto');
    
    // Создаем подпись для запроса сессии
    const sigString = `api_key${LASTFM_API_KEY}methodauth.getSessiontoken${token}${LASTFM_API_SECRET}`;
    const sig = crypto.createHash('md5').update(sigString).digest('hex');
    
    console.log('Generated signature for Last.fm');
    
    // Запрашиваем сессию у Last.fm
    const sessionUrl = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${LASTFM_API_KEY}&token=${token}&api_sig=${sig}&format=json`;
    
    console.log('Requesting Last.fm session...');
    const sessionResponse = await fetch(sessionUrl);
    
    if (!sessionResponse.ok) {
      console.error('Last.fm API returned error status:', sessionResponse.status);
      const errorText = await sessionResponse.text();
      console.error('Error response:', errorText);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=api_error`);
    }
    
    const sessionData = await sessionResponse.json();
    console.log('Session response:', JSON.stringify(sessionData));
    
    if (sessionData.error) {
      console.error('Last.fm API error:', sessionData.error, sessionData.message);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=${sessionData.error}`);
    }
    
    if (sessionData.session && sessionData.session.name) {
      const username = sessionData.session.name;
      const sessionKey = sessionData.session.key;
      
      console.log('Last.fm connected successfully for user:', username);
      
      // Создаем response с редиректом на профиль
      const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=connected&username=${encodeURIComponent(username)}`;
      const response = NextResponse.redirect(profileUrl);
      
      // Сохраняем данные в куки
      const lastfmData = {
        username: username,
        sessionKey: sessionKey,
        connectedAt: new Date().toISOString()
      };
      
      // ВАЖНО: httpOnly: false чтобы JavaScript мог прочитать
      response.cookies.set('lastfm_user', JSON.stringify(lastfmData), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 дней
        path: '/'
      });
      
      // Дублируем username для простоты
      response.cookies.set('lastfm_username', username, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      });
      
      console.log('Redirecting to profile with Last.fm connected');
      return response;
      
    } else {
      console.error('No session in response:', sessionData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=no_session`);
    }
    
  } catch (error) {
    console.error('Last.fm callback error:', error);
    
    // Логируем детали ошибки
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world'}/profile?lastfm=error&message=callback_failed`
    );
  }
}