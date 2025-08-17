import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect("https://tootfm.world/profile?error=spotify_denied");
  }

  if (!code) {
    return NextResponse.redirect("https://tootfm.world/profile?error=no_code");
  }

  try {
    // Жёстко прописываем продакшен URL
    const redirectUri = "https://tootfm.world/api/spotify/callback";
    const clientId = "d030154634934d92a7dc08ad9770f80f";
    const clientSecret = "1f04e94a75b5408f838a0db9e29d6f67";
    
    // Обмен кода на токен
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri, // ВАЖНО: точно такой же как в Spotify Dashboard
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("Spotify token error:", errorText);
      return NextResponse.redirect("https://tootfm.world/profile?error=token_failed");
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль пользователя
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect("https://tootfm.world/profile?error=profile_failed");
    }

    const profileData = await profileResponse.json();

    // Редирект с установкой cookies
    const response = NextResponse.redirect("https://tootfm.world/profile?spotify=connected");

    // Сохраняем токен
    response.cookies.set("spotify_token", tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 3600, // 1 час
    });

    // Сохраняем данные пользователя
    response.cookies.set("spotify_user", JSON.stringify({
      id: profileData.id,
      name: profileData.display_name,
      email: profileData.email,
      image: profileData.images?.[0]?.url,
    }), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: 2592000, // 30 дней
    });

    return response;

  } catch (error) {
    console.error("Spotify callback error:", error);
    return NextResponse.redirect("https://tootfm.world/profile?error=unknown");
  }
}
