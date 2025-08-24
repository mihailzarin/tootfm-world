// app/api/spotify/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect('/profile?error=spotify_auth_failed');
  }

  if (!code) {
    return NextResponse.redirect('/profile?error=no_code');
  }

  // Перенаправляем на профиль с кодом
  return NextResponse.redirect(`/profile?spotify_code=${code}&state=${state}`);
}