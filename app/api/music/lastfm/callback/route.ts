import { NextRequest, NextResponse } from 'next/server';
import { LastFmAdapter } from '@/lib/music-services/lastfm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?error=no_token`);
    }

    const apiKey = process.env.LASTFM_API_KEY!;
    const apiSecret = process.env.LASTFM_API_SECRET!;
    
    const adapter = new LastFmAdapter(apiKey, apiSecret);
    const profile = await adapter.handleCallback(token);
    
    // Редирект с сохранением в cookie
    const response = NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/profile?lastfm=connected&username=${adapter.getUsername()}`
    );
    
    // ВАЖНО: Сохраняем cookie правильно
    response.cookies.set('lastfm_user', JSON.stringify({
      username: adapter.getUsername(),
      sessionKey: adapter.getSessionKey(),
      profile: profile
    }), {
      httpOnly: false,
      secure: false,  // Для localhost
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/'
    });
    
    return response;
  } catch (error) {
    console.error('Last.fm callback error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/profile?error=lastfm_failed`);
  }
}
