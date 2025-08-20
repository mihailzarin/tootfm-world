// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = cookies();
  
  // Удаляем все auth cookies
  const cookiesToDelete = [
    'tootfm_user_id',
    'google_tokens',
    'spotify_token',
    'spotify_refresh',
    'spotify_user',
    'lastfm_session',
    'lastfm_username',
    'tootfm_uid'
  ];
  
  cookiesToDelete.forEach(name => {
    cookieStore.delete(name);
  });
  
  return NextResponse.json({ success: true });
}