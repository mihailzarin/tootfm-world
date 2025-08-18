// app/api/spotify/callback/route.ts
// Исправленный callback для Spotify с правильным сохранением токена

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';

  if (error) {
    console.error('❌ Spotify auth error:', error);
    return NextResponse.redirect(`${baseUrl}/profile?error=spotify_denied`);
  }

  if (!code) {
    console.error('❌ No code in Spotify callback');
    return NextResponse.redirect(`${baseUrl}/profile?error=no_code`);
  }

  try {
    console.log('🎵 Processing Spotify callback...');
    
    // Получаем токен от Spotify
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    const REDIRECT_URI = `${baseUrl}/api/spotify/callback`;
    
    console.log('📝 Token exchange params:', {
      client_id: CLIENT_ID?.substring(0, 10) + '...',
      redirect_uri: REDIRECT_URI
    });
    
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("❌ Token exchange failed:", errorData);
      return NextResponse.redirect(`${baseUrl}/profile?error=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received, expires in:', tokenData.expires_in, 'seconds');

    // Получаем профиль пользователя
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      },
    });

    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch Spotify profile');
      return NextResponse.redirect(`${baseUrl}/profile?error=profile_failed`);
    }

    const profileData = await profileResponse.json();
    console.log('✅ Spotify profile fetched:', profileData.display_name);

    // Создаем response с редиректом
    const response = NextResponse.redirect(`${baseUrl}/profile?spotify=connected&tab=services`);

    // ВАЖНО: Сохраняем ВСЕ необходимые cookies

    // 1. Access Token для API запросов (httpOnly для безопасности)
    response.cookies.set("spotify_token", tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600, // Обычно 1 час
      path: "/"
    });
    
    console.log('✅ Set spotify_token cookie');

    // 2. Refresh Token для обновления access token
    if (tokenData.refresh_token) {
      response.cookies.set("spotify_refresh", tokenData.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 год
        path: "/"
      });
      console.log('✅ Set spotify_refresh cookie');
    }

    // 3. Время истечения токена
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    response.cookies.set("spotify_expires", expiresAt.toISOString(), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600,
      path: "/"
    });
    
    console.log('✅ Token expires at:', expiresAt.toISOString());

    // 4. Данные пользователя для UI
    const userData = {
      id: profileData.id,
      name: profileData.display_name,
      email: profileData.email,
      image: profileData.images?.[0]?.url,
      product: profileData.product, // free или premium
      country: profileData.country
    };
    
    response.cookies.set("spotify_user", JSON.stringify(userData), {
      httpOnly: false, // Можем читать на клиенте для UI
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
      path: "/"
    });
    
    console.log('✅ Set spotify_user cookie');

    console.log('🎉 Spotify connection complete!', {
      user: profileData.display_name,
      product: profileData.product,
      cookiesSet: ['spotify_token', 'spotify_refresh', 'spotify_expires', 'spotify_user']
    });

    return response;

  } catch (error) {
    console.error("❌ Spotify callback error:", error);
    return NextResponse.redirect(`${baseUrl}/profile?error=unknown`);
  }
}