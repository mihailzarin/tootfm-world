import { NextResponse } from 'next/server';

export async function GET() {
  // ИСПОЛЬЗУЕМ НОВЫЕ ПРАВИЛЬНЫЕ CREDENTIALS!
  const CLIENT_ID = '68a7ea6587af43cc893cc0994a584eff';
  const REDIRECT_URI = 'https://tootfm.world/api/spotify/callback';
  
  const scope = 'user-read-private user-read-email user-top-read user-library-read';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
  });

  const authUrl = `https://accounts.spotify.com/authorize?${params}`;
  console.log('Redirecting to:', authUrl);
  
  return NextResponse.redirect(authUrl);
}
