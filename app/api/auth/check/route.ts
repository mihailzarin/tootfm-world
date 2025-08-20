// app/api/auth/check/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Проверяем разные способы авторизации
    const userId = cookieStore.get('tootfm_user_id');
    const googleTokens = cookieStore.get('google_tokens');
    const spotifyUser = cookieStore.get('spotify_user');
    
    // Если есть любой из идентификаторов - пользователь авторизован
    const isAuthenticated = !!(userId || googleTokens || spotifyUser);
    
    return NextResponse.json({
      authenticated: isAuthenticated,
      userId: userId?.value || null,
      hasGoogle: !!googleTokens,
      hasSpotify: !!spotifyUser
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      userId: null
    });
  }
}