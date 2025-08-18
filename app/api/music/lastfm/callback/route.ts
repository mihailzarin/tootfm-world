// app/api/music/lastfm/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  if (!token) {
    console.error('No token in callback');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=error&message=no_token`);
  }

  const LASTFM_API_KEY = process.env.LASTFM_API_KEY!;
  const LASTFM_API_SECRET = process.env.LASTFM_API_SECRET!;
  
  try {
    console.log('Processing Last.fm callback with token:', token);
    
    // Получаем session key от Last.fm
    const sig = crypto
      .createHash('md5')
      .update(`api_key${LASTFM_API_KEY}methodauth.getSessiontoken${token}${LASTFM_API_SECRET}`)
      .digest('hex');
    
    const sessionUrl = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${LASTFM_API_KEY}&token=${token}&api_sig=${sig}&format=json`;
    
    console.log('Requesting Last.fm session...');
    const sessionResponse = await fetch(sessionUrl);
    const sessionData = await sessionResponse.json();
    
    console.log('Session response:', sessionData);
    
    if (sessionData.error) {
      console.error('Last.fm API error:', sessionData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=error&message=${sessionData.error}`);
    }
    
    if (sessionData.session) {
      const { name: username, key: sessionKey } = sessionData.session;
      
      console.log('Last.fm connected successfully for user:', username);
      
      // Создаем response с редиректом
      const response = NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=connected&username=${username}`
      );
      
      // ВАЖНО: Сохраняем данные в куки для доступа из браузера
      const lastfmData = {
        username: username,
        sessionKey: sessionKey,
        connectedAt: new Date().toISOString()
      };
      
      // Сохраняем куки которые можно прочитать в браузере
      response.cookies.set('lastfm_user', JSON.stringify(lastfmData), {
        httpOnly: false, // ВАЖНО: false чтобы JS мог прочитать
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 дней
        path: '/'
      });
      
      // Дублируем username отдельно для простоты
      response.cookies.set('lastfm_username', username, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      });
      
      // Сохраняем session key в httpOnly куки для безопасности
      response.cookies.set('lastfm_session', sessionKey, {
        httpOnly: true, // Защищенная кука
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
      });
      
      return response;
      
    } else {
      console.error('No session in response:', sessionData);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=error&message=no_session`);
    }
    
  } catch (error) {
    console.error('Last.fm callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=error&message=callback_failed`
    );
  }
}