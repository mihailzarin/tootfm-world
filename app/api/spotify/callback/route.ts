import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Определяем базовый URL
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://tootfm.world' 
    : 'http://localhost:3000';

  // Обработка ошибок
  if (error) {
    return NextResponse.redirect(`${baseUrl}/profile?error=spotify_denied`);
  }

  // Проверка state для защиты от CSRF
  const savedState = request.cookies.get('spotify_auth_state')?.value;
  if (!state || state !== savedState) {
    return NextResponse.redirect(`${baseUrl}/profile?error=invalid_state`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/profile?error=no_code`);
  }

  try {
    // Используем переменные окружения
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

    // Проверяем наличие переменных
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      console.error('Missing Spotify environment variables');
      return NextResponse.redirect(`${baseUrl}/profile?error=config_error`);
    }
    
    // Обмен кода на токен
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Spotify token error:", errorText);
      return NextResponse.redirect(`${baseUrl}/profile?error=token_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль пользователя
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(`${baseUrl}/profile?error=profile_failed`);
    }

    const profileData = await profileResponse.json();

    // Получаем World ID из cookie
    const worldId = request.cookies.get('world_id')?.value;

    // Если есть Prisma и worldId, сохраняем в БД
    if (worldId) {
      try {
        // Импортируем prisma только если он настроен
        const { prisma } = await import('@/lib/prisma').catch(() => ({ prisma: null }));
        
        if (prisma) {
          await prisma.user.update({
            where: { worldId },
            data: {
              spotifyId: profileData.id,
              spotifyName: profileData.display_name,
              spotifyEmail: profileData.email,
              spotifyImage: profileData.images?.[0]?.url,
              spotifyAccessToken: tokenData.access_token,
              spotifyRefreshToken: tokenData.refresh_token,
              spotifyTokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000)
            }
          });
        }
      } catch (dbError) {
        console.error('Database update error:', dbError);
        // Продолжаем даже если БД не обновилась
      }
    }

    // Создаем response с редиректом
    const response = NextResponse.redirect(`${baseUrl}/profile?spotify=connected`);

    // Сохраняем токен в httpOnly cookie (безопасно)
    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: tokenData.expires_in || 3600, // Обычно 1 час
    });

    // Сохраняем refresh token (для обновления access token)
    if (tokenData.refresh_token) {
      response.cookies.set("spotify_refresh_token", tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60, // 30 дней
      });
    }

    // Сохраняем базовую информацию о пользователе (НЕ чувствительную)
    response.cookies.set("spotify_user", JSON.stringify({
      id: profileData.id,
      name: profileData.display_name,
      image: profileData.images?.[0]?.url,
      connected: true
    }), {
      httpOnly: false, // Доступно для клиента
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 дней
    });

    // Удаляем state cookie
    response.cookies.delete('spotify_auth_state');

    return response;

  } catch (error) {
    console.error("Spotify callback error:", error);
    return NextResponse.redirect(`${baseUrl}/profile?error=unknown`);
  }
}
