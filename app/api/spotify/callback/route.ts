import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = 'https://tootfm.world';

  if (error) {
    return NextResponse.redirect(`${baseUrl}/profile?error=spotify_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/profile?error=no_code`);
  }

  try {
    // Используем env переменные (они точно есть в Production!)
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;
    
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
      console.error("Token exchange failed:", errorText);
      return NextResponse.redirect(`${baseUrl}/profile?error=token_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    // Успех! Возвращаем на профиль
    const response = NextResponse.redirect(`${baseUrl}/profile?spotify=connected`);

    // Сохраняем токен
    response.cookies.set("spotify_access_token", tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 3600,
    });

    // Сохраняем данные пользователя
    response.cookies.set("spotify_user", JSON.stringify({
      id: profileData.id,
      name: profileData.display_name,
      email: profileData.email,
      image: profileData.images?.[0]?.url,
      connected: true
    }), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;

  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${baseUrl}/profile?error=unknown`);
  }
}
