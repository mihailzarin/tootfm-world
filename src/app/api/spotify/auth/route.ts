import { NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

export async function GET() {
  const scope = [
    'user-read-private',
    'user-read-email',
    'user-library-read',
    'user-top-read',
    'playlist-read-private',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    state: Math.random().toString(36).substring(7)
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params.toString()}`;
  
  return NextResponse.redirect(authUrl);
}