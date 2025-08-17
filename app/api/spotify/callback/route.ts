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
    // ВАЖНО: Точно такие же значения как в Spotify Dashboard!
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || '';
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || '';
    // КРИТИЧНО: Этот URL должен ТОЧНО совпадать с тем что в Spotify App Settings
    const REDIRECT_URI = 'https://tootfm.world/api/spotify/callback';
    
    console.log('Exchanging code for token...');
    console.log('Redirect URI:', REDIRECT_URI);
    
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: REDIRECT_URI, // MUST match exactly!
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token error:", errorData);
      return NextResponse.redirect(`${baseUrl}/profile?error=token_failed&details=${errorData.error}`);
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    // Успех!
    const response = NextResponse.redirect(`${baseUrl}/profile?spotify=connected&name=${encodeURIComponent(profileData.display_name || 'User')}`);

    // Сохраняем данные
    response.cookies.set("spotify_token", tokenData.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 3600,
    });

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
