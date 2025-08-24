import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

// POST метод - для OAuth callback (обмен кода на токен)
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

// GET метод - для получения токена из БД (для плеера)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Not authenticated' 
      }, { status: 401 });
    }

    const spotifyService = await prisma.musicService.findFirst({
      where: {
        userId: session.user.id,
        service: 'SPOTIFY',
        isActive: true
      }
    });

    if (!spotifyService || !spotifyService.accessToken) {
      return NextResponse.json({ 
        error: 'Spotify not connected' 
      }, { status: 404 });
    }

    // Проверяем не истёк ли токен
    if (spotifyService.tokenExpiry && spotifyService.tokenExpiry < new Date()) {
      // Если есть refresh token - обновляем
      if (spotifyService.refreshToken) {
        try {
          const tokenResponse = await fetch(SPOTIFY_TOKEN_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Basic ${Buffer.from(
                `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
              ).toString('base64')}`
            },
            body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: spotifyService.refreshToken
            })
          });
          
          if (tokenResponse.ok) {
            const tokens = await tokenResponse.json();
            
            // Обновляем токен в БД
            await prisma.musicService.update({
              where: { id: spotifyService.id },
              data: {
                accessToken: tokens.access_token,
                tokenExpiry: new Date(Date.now() + tokens.expires_in * 1000)
              }
            });
            
            // Возвращаем токен для плеера
            return NextResponse.json({
              accessToken: tokens.access_token,
              expiresAt: new Date(Date.now() + tokens.expires_in * 1000)
            });
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
        }
      }
      
      return NextResponse.json({ 
        error: 'Token expired and cannot refresh' 
      }, { status: 401 });
    }

    // Токен валидный - возвращаем его
    return NextResponse.json({
      accessToken: spotifyService.accessToken,
      expiresAt: spotifyService.tokenExpiry
    });

  } catch (error) {
    console.error('Error getting Spotify token:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}