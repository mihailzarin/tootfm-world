// app/api/spotify/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://tootfm.world/api/spotify/callback'
    : 'http://localhost:3000/api/spotify/callback';
  
  const state = Math.random().toString(36).substring(7);
  const scope = 'user-read-private user-read-email user-top-read user-library-read streaming user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private';
  
  const authUrl = `https://accounts.spotify.com/authorize?` +
    `client_id=${clientId}&` +
    `response_type=code&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `state=${state}&` +
    `scope=${encodeURIComponent(scope)}`;
  
  return NextResponse.redirect(authUrl);
}