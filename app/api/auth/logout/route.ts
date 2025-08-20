// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  const cookiesToDelete = [
    'tootfm_user_id',
    'google_tokens',
    'google_user',
    'spotify_token',
    'spotify_refresh',
    'spotify_user',
    'lastfm_session',
    'lastfm_username'
  ];
  
  // Удаляем cookies с правильным domain
  cookiesToDelete.forEach(name => {
    cookieStore.set(name, '', {
      maxAge: 0,
      domain: process.env.NODE_ENV === 'production' ? '.tootfm.world' : undefined
    });
  });
  
  return NextResponse.json({ success: true });
}