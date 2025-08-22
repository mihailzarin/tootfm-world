// app/api/spotify/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUserByService } from "@/lib/auth/server-auth";
import { AUTH_CONFIG, getRedirectUrl, getCookieOptions } from "@/lib/auth/config";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const state = searchParams.get("state");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';

    if (error) {
      console.error('❌ Spotify auth error:', error);
      return NextResponse.redirect(`${baseUrl}/?error=spotify_denied`);
    }

    if (!code) {
      console.error('❌ No code in Spotify callback');
      return NextResponse.redirect(`${baseUrl}/?error=no_code`);
    }

    console.log('🎵 Processing Spotify callback...');
    
    // Get token from Spotify
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
    const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
    const REDIRECT_URI = getRedirectUrl('spotify');
    
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
      return NextResponse.redirect(`${baseUrl}/?error=token_failed`);
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received, expires in:', tokenData.expires_in, 'seconds');

    // Get user profile from Spotify
    const profileResponse = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`
      },
    });

    if (!profileResponse.ok) {
      console.error('❌ Failed to fetch Spotify profile');
      return NextResponse.redirect(`${baseUrl}/?error=profile_failed`);
    }

    const profileData = await profileResponse.json();
    console.log('✅ Spotify profile fetched:', profileData.display_name);

    // Find or create user in our database
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    
    const user = await findOrCreateUserByService('spotify', {
      id: profileData.id,
      email: profileData.email,
      displayName: profileData.display_name,
      avatar: profileData.images?.[0]?.url,
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: expiresAt
    });

    console.log('✅ User authenticated:', user.displayName);

    // Create response with redirect
    const response = NextResponse.redirect(`${baseUrl}/profile?welcome=true`);

    // Save Spotify tokens in cookies
    response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN, tokenData.access_token, {
      ...getCookieOptions(true),
      maxAge: tokenData.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
    });
    
    if (tokenData.refresh_token) {
      response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH, tokenData.refresh_token, {
        ...getCookieOptions(true),
        maxAge: AUTH_CONFIG.EXPIRATION.REFRESH_TOKEN
      });
    }

    response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES, expiresAt.toISOString(), {
      ...getCookieOptions(false),
      maxAge: tokenData.expires_in || AUTH_CONFIG.EXPIRATION.ACCESS_TOKEN
    });

    // Save user data for UI
    const userData = {
      id: profileData.id,
      name: profileData.display_name,
      email: profileData.email,
      image: profileData.images?.[0]?.url,
      product: profileData.product,
      country: profileData.country
    };
    
    response.cookies.set(AUTH_CONFIG.COOKIES.SPOTIFY_USER, JSON.stringify(userData), {
      ...getCookieOptions(false),
      maxAge: AUTH_CONFIG.EXPIRATION.SESSION
    });

    console.log('🎉 Spotify login complete!');
    return response;

  } catch (error) {
    console.error("❌ Spotify callback error:", error);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
    return NextResponse.redirect(`${baseUrl}/?error=server_error`);
  }
}
