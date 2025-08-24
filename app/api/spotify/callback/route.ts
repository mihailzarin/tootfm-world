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
  
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.NODE_ENV === 'production' 
    ? 'https://tootfm.world/api/spotify/callback'
    : 'http://localhost:3000/api/spotify/callback';
  
  if (!clientId || !clientSecret) {
    console.error('Missing Spotify credentials!');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=config_error`);
  }
  
  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_denied`);
  }
  
  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=no_code`);
  }
  
  try {
    // Получаем сессию
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session?.user));
    
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login`);
    }
    
    // Находим пользователя в БД по email
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    
    if (!dbUser) {
      console.error('User not found in DB:', session.user.email);
      // Создаём пользователя если его нет
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          image: session.user.image || null,
        }
      });
      console.log('Created new user:', newUser.id);
    }
    
    const userId = dbUser?.id || (await prisma.user.findUnique({
      where: { email: session.user.email }
    }))?.id;
    
    if (!userId) {
      throw new Error('Could not get user ID');
    }
    
    console.log('Using userId:', userId);
    
    // Обмениваем код на токены
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
        redirect_uri: redirectUri
      })
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=token_failed`);
    }
    
    const tokens = await tokenResponse.json();
    console.log('Tokens received');
    
    // Получаем профиль Spotify
    const profileResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`
      }
    });
    
    if (!profileResponse.ok) {
      console.error('Profile fetch failed');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=profile_failed`);
    }
    
    const profile = await profileResponse.json();
    console.log('Spotify profile:', profile.id);
    
    // Сохраняем в БД
    const existing = await prisma.musicService.findFirst({
      where: {
        userId: userId,
        service: 'SPOTIFY'
      }
    });
    
    if (existing) {
      await prisma.musicService.update({
        where: { id: existing.id },
        data: {
          spotifyId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existing.refreshToken,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true,
          lastSynced: new Date()
        }
      });
      console.log('Updated Spotify connection');
    } else {
      await prisma.musicService.create({
        data: {
          userId: userId,
          service: 'SPOTIFY',
          spotifyId: profile.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true
        }
      });
      console.log('Created Spotify connection');
    }
    
    console.log('✅ Spotify connected successfully');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?spotify=connected&tab=services`);
    
  } catch (error) {
    console.error('❌ Callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_error`);
  }
}