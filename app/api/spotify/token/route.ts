import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

export async function POST(request: NextRequest) {
  try {
    const { code, state } = await request.json();
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    // Получаем токены от Spotify
    const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Spotify token error:', error);
      return NextResponse.json({ error: 'Failed to get token' }, { status: 400 });
    }

    const tokenData = await tokenResponse.json();

    // Получаем профиль пользователя
    const profileResponse = await fetch(`${SPOTIFY_API_BASE}/me`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!profileResponse.ok) {
      return NextResponse.json({ error: 'Failed to get profile' }, { status: 400 });
    }

    const profile = await profileResponse.json();
    
    // Получаем сессию NextAuth
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      // Сохраняем в БД
      await prisma.musicService.upsert({
        where: {
          userId_service: {
            userId: session.user.id,
            service: 'SPOTIFY'
          }
        },
        update: {
          spotifyId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          isActive: true,
          lastSynced: new Date()
        },
        create: {
          userId: session.user.id,
          service: 'SPOTIFY',
          spotifyId: profile.id,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpiry: new Date(Date.now() + tokenData.expires_in * 1000),
          isActive: true
        }
      });
    }

    // Возвращаем данные для сохранения в localStorage
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email,
        images: profile.images,
        product: profile.product
      },
      // ВАЖНО: Добавляем токены для localStorage
      tokens: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString()
      }
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        connected: false,
        message: 'Not authenticated' 
      });
    }

    // Проверяем есть ли активное подключение Spotify
    const musicService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY',
        isActive: true
      }
    });

    if (!musicService) {
      return NextResponse.json({ 
        connected: false,
        message: 'Spotify not connected' 
      });
    }

    // Проверяем не истёк ли токен
    if (musicService.tokenExpiry && musicService.tokenExpiry < new Date()) {
      // Токен истёк, нужно обновить
      return NextResponse.json({ 
        connected: false,
        message: 'Token expired',
        needsRefresh: true
      });
    }

    return NextResponse.json({
      connected: true,
      spotifyId: musicService.spotifyId,
      expiresAt: musicService.tokenExpiry
    });

  } catch (error) {
    console.error('Error checking Spotify connection:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}