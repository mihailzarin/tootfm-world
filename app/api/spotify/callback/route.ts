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
    // ПРАВИЛЬНЫЕ CREDENTIALS
    const CLIENT_ID = '68a7ea6587af43cc893cc0994a584eff';
    const CLIENT_SECRET = 'cd2b848b64e743c784600947a13459f2';
    const REDIRECT_URI = 'https://tootfm.world/api/spotify/callback';
    
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token error:", errorData);
      return NextResponse.redirect(`${baseUrl}/profile?error=token_failed`);
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль пользователя
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}` // ИСПРАВЛЕНО: добавлены обратные кавычки
      },
    });

    const profileData = await profileResponse.json();

    // Успех! Редирект на профиль
    const response = NextResponse.redirect(`${baseUrl}/profile?spotify=connected`);

    // Сохраняем токен
    response.cookies.set("spotify_token", tokenData.access_token, {
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
    }), {
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      maxAge: 86400 * 30,
    });

    return response;

  } catch (error) {
    console.error("Error:", error);
    return NextResponse.redirect(`${baseUrl}/profile?error=unknown`);
  }
}
