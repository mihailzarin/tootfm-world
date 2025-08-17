import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Если ошибка от Spotify
  if (error) {
    return NextResponse.redirect(new URL("/profile?error=spotify_denied", request.url));
  }

  // Если нет кода авторизации
  if (!code) {
    return NextResponse.redirect(new URL("/profile?error=no_code", request.url));
  }

  try {
    // Обмениваем код на токен
    const clientId = process.env.SPOTIFY_CLIENT_ID || "d030154634934d92a7dc08ad9770f80f";
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || "1f04e94a75b5408f838a0db9e29d6f67";
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "https://tootfm.world"}/api/spotify/callback`;

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Spotify token error:", errorData);
      return NextResponse.redirect(new URL("/profile?error=token_failed", request.url));
    }

    const tokenData = await tokenResponse.json();

    // Получаем информацию о пользователе
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(new URL("/profile?error=profile_failed", request.url));
    }

    const profileData = await profileResponse.json();

    // Создаём response с редиректом
    const response = NextResponse.redirect(new URL("/profile?spotify=connected", request.url));

    // Сохраняем токены в cookies (безопаснее чем localStorage)
    response.cookies.set("spotify_token", tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60, // 1 час
    });

    response.cookies.set("spotify_refresh", tokenData.refresh_token || "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });

    response.cookies.set("spotify_user", JSON.stringify({
      id: profileData.id,
      name: profileData.display_name,
      email: profileData.email,
      image: profileData.images?.[0]?.url,
    }), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 дней
    });

    return response;

  } catch (error) {
    console.error("Spotify callback error:", error);
    return NextResponse.redirect(new URL("/profile?error=unknown", request.url));
  }
}
