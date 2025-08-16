import { NextRequest, NextResponse } from 'next/server';

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const SPOTIFY_REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/player?error=spotify_auth_failed', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/player?error=no_code', request.url));
  }

  try {
    // Обмениваем код на токен
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: SPOTIFY_REDIRECT_URI
      })
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.access_token) {
      // Получаем информацию о пользователе
      const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });

      const userData = await userResponse.json();

      // Создаём response с куками
      const response = NextResponse.redirect(new URL('/player?spotify=connected', request.url));
      
      // Сохраняем токены в куки (в реальном приложении используйте более безопасный способ)
      response.cookies.set('spotify_access_token', tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: tokenData.expires_in
      });
      
      response.cookies.set('spotify_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      response.cookies.set('spotify_user', JSON.stringify({
        id: userData.id,
        name: userData.display_name,
        email: userData.email,
        image: userData.images?.[0]?.url
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      return response;
    } else {
      return NextResponse.redirect(new URL('/player?error=token_failed', request.url));
    }
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(new URL('/player?error=callback_error', request.url));
  }
}