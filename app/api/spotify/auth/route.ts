import { NextResponse } from 'next/server';
import crypto from 'crypto';

const SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize';

// Используем переменные окружения - НИКОГДА не хардкодим!
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'user-library-read',
  'user-read-recently-played',
  'user-read-playback-state',
  'user-modify-playback-state',
  'streaming',
  'playlist-read-private',
  'playlist-read-collaborative'
].join(' ');

export async function GET() {
  // Проверяем наличие переменных окружения
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
    show_dialog: 'false' // Не показывать диалог если уже авторизован
  });

  const authUrl = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
  
  const response = NextResponse.redirect(authUrl);
  
  // Сохраняем state в cookie для проверки
  response.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10 // 10 минут
  });

  return response;
}
