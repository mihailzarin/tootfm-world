import { NextResponse } from 'next/server';

export async function GET() {
  const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
  const REDIRECT_URI = 'https://tootfm.world/api/spotify/callback';
  
  const scope = 'user-read-private user-read-email user-top-read user-library-read';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
}
