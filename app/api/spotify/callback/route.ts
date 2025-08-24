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
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=token_failed`);
    }
    
    const tokens = await tokenResponse.json();
    console.log('Tokens received');
    
    // Получаем профиль
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
    
    // ИСПОЛЬЗУЕМ findFirst + update/create вместо upsert
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
          refreshToken: tokens.refresh_token,
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
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?spotify=connected`);
    
  } catch (error) {
    console.error('Callback error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : '');
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/profile?error=spotify_error`);
  }
}