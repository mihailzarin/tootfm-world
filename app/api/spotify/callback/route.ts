import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  
  console.log('=== SPOTIFY CALLBACK ===');
  console.log('Code:', code ? 'present' : 'missing');
  console.log('Error:', error);
  
  // Проверяем переменные окружения
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://tootfm.world/api/spotify/callback'
    : 'http://localhost:3000/api/spotify/callback';
  
  console.log('Environment check:');
  console.log('- Client ID:', clientId ? 'present' : 'MISSING!');
  console.log('- Client Secret:', clientSecret ? 'present' : 'MISSING!');
  console.log('- Redirect URI:', redirectUri);
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  
  if (!clientId || !clientSecret) {
    console.error('Missing Spotify credentials!');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=config_error`);
  }
  
  if (error) {
    console.log('User denied authorization');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_denied`);
  }
  
  if (!code) {
    console.log('No code in callback');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=no_code`);
  }
  
  try {
    const session = await getServerSession(authOptions);
    console.log('Session exists:', !!session);
    console.log('User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.log('No session found');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`);
    }
    
    // Обмениваем код на токены
    console.log('Exchanging code for tokens...');
    console.log('Using redirect_uri:', redirectUri);
    
    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri  // Используем правильную переменную
      })
    });
    
    const responseText = await tokenResponse.text();
    console.log('Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', responseText);
      // Парсим ошибку от Spotify
      try {
        const errorData = JSON.parse(responseText);
        console.error('Spotify error:', errorData.error, errorData.error_description);
      } catch {
        console.error('Raw error:', responseText);
      }
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=token_failed`);
    }
    
    const tokens = JSON.parse(responseText);
    console.log('Tokens received successfully');
    console.log('Access token expires in:', tokens.expires_in, 'seconds');
    
    // Получаем профиль
    console.log('Fetching Spotify profile...');
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!profileResponse.ok) {
      const profileError = await profileResponse.text();
      console.error('Profile fetch failed:', profileError);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=profile_failed`);
    }
    
    const profile = await profileResponse.json();
    console.log('Spotify profile fetched:', {
      id: profile.id,
      display_name: profile.display_name,
      email: profile.email,
      product: profile.product // free или premium
    });
    
    // Сохраняем в базу данных
    console.log('Saving to database...');
    
    const existing = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY'
      }
    });
    
    if (existing) {
      await prisma.musicService.update({
        where: { id: existing.id },
        data: {
          spotifyId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existing.refreshToken, // Spotify не всегда возвращает refresh_token
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true,
          lastSynced: new Date()
        }
      });
      console.log('Updated existing Spotify connection');
    } else {
      await prisma.musicService.create({
        data: {
          userId: session.user.id,
          service: 'SPOTIFY',
          spotifyId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true
        }
      });
      console.log('Created new Spotify connection');
    }
    
    console.log('✅ Spotify connected successfully');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?spotify=connected&tab=services`);
    
  } catch (error) {
    console.error('❌ Callback error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : '');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_error`);
  }
}