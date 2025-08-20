// app/api/auth/google/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://tootfm.world/api/auth/google/callback'
    : 'http://localhost:3001/api/auth/google/callback';

  const scopes = [
    'openid',
    'email', 
    'profile',
    'https://www.googleapis.com/auth/youtube.readonly'
  ].join(' ');

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scopes)}&` +
    `access_type=offline&` +
    `prompt=consent`;

  return NextResponse.redirect(authUrl);
}