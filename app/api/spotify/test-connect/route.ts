import { NextResponse } from 'next/server';

export async function GET() {
  // Тестовый URL для проверки что OAuth начинается правильно
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || 'https://tootfm.world/api/spotify/callback';
  
  if (!clientId) {
    return NextResponse.json({ 
      error: 'Spotify client ID not configured',
      env_checked: {
        NEXT_PUBLIC_SPOTIFY_CLIENT_ID: !!process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
        SPOTIFY_CLIENT_ID: !!process.env.SPOTIFY_CLIENT_ID
      }
    }, { status: 500 });
  }
  
  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-top-read',
    'user-library-read',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state'
  ].join(' ');
  
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `show_dialog=true`;
  
  return NextResponse.json({
    client_id: clientId,
    redirect_uri: redirectUri,
    auth_url: authUrl,
    instructions: 'Copy auth_url and open in browser to test Spotify OAuth'
  });
}