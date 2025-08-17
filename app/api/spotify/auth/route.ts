import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
  'user-read-recently-played',
  'playlist-read-private'
].join(' ');

export async function GET() {
  if (!CLIENT_ID || !REDIRECT_URI) {
    console.error('Missing Spotify environment variables');
    return NextResponse.json(
      { error: 'Configuration error' },
      { status: 500 }
    );
  }

  // Генерируем state для защиты от CSRF
  const state = crypto.randomBytes(16).toString('hex');
  
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    state: state,
    show_dialog: 'false'
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  
  const response = NextResponse.redirect(authUrl);
  
  // Устанавливаем cookie с правильными параметрами для продакшена
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: true, // Всегда true для HTTPS
    sameSite: 'lax', // Позволяет cookie при редиректах
    maxAge: 60 * 10, // 10 минут
    path: '/', // Доступен для всех путей
    domain: '.tootfm.world' // Доступен для всех поддоменов
  });

  console.log('Set state cookie:', state);

  return response;
}
