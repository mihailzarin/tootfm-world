// app/api/spotify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Если была ошибка от Spotify
    if (error) {
      console.error('Spotify auth error:', error);
      return NextResponse.redirect(new URL('/profile?error=spotify_auth_failed', request.url));
    }

    // Проверяем наличие кода
    if (!code) {
      console.error('No code received from Spotify');
      return NextResponse.redirect(new URL('/profile?error=no_code', request.url));
    }

    console.log('Spotify callback received code:', code.substring(0, 20) + '...');

    // Создаём URL для редиректа на профиль с кодом
    const profileUrl = new URL('/profile', request.url);
    profileUrl.searchParams.set('spotify_code', code);
    if (state) {
      profileUrl.searchParams.set('state', state);
    }

    console.log('Redirecting to:', profileUrl.toString());

    // Перенаправляем на профиль с кодом
    return NextResponse.redirect(profileUrl);

  } catch (error) {
    console.error('Callback processing error:', error);
    // В случае ошибки - редиректим на профиль с ошибкой
    return NextResponse.redirect(new URL('/profile?error=callback_failed', request.url));
  }
}