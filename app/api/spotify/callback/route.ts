import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Изменен импорт!
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  // Обработка отмены авторизации
  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_denied`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=no_code`);
  }
  
  try {
    // Проверяем сессию
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`);
    }
    
    // Обмениваем код на токены
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI || 'https://tootfm.world/api/spotify/callback'
      })
    });
    
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Spotify token error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=token_failed`);
    }
    
    const tokens = await tokenResponse.json();
    
    // Получаем профиль пользователя Spotify
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!profileResponse.ok) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=profile_failed`);
    }
    
    const profile = await profileResponse.json();
    
    // Сохраняем или обновляем в БД
    await prisma.musicService.upsert({
      where: {
        userId_service: {
          userId: session.user.id,
          service: 'SPOTIFY'
        }
      },
      update: {
        spotifyId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
        lastSynced: new Date()
      },
      create: {
        userId: session.user.id,
        service: 'SPOTIFY',
        spotifyId: profile.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        isActive: true,
        lastSynced: new Date()
      }
    });
    
    console.log(`Spotify connected for user ${session.user.id}`);
    
    // Редирект обратно на профиль с успехом
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?spotify=connected`);
    
  } catch (error) {
    console.error('Spotify callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_error`);
  }
}