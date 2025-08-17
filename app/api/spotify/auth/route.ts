import { NextResponse } from 'next/server';

export async function GET() {
  // ЗАХАРДКОДИМ ПРАВИЛЬНЫЕ ЗНАЧЕНИЯ ПРЯМО ЗДЕСЬ!
  // Потом вернем env переменные когда заработает
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
  
  // Логируем для отладки
  console.log('AUTH URL:', authUrl);
  console.log('CLIENT_ID being used:', CLIENT_ID);
  
  return NextResponse.redirect(authUrl);
}
