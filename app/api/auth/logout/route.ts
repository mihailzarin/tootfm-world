// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG, getCookieOptions } from '@/lib/auth/config';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // All cookies to delete using centralized names
    const cookiesToDelete = [
      AUTH_CONFIG.COOKIES.USER_ID,
      AUTH_CONFIG.COOKIES.GOOGLE_USER,
      AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN,
      AUTH_CONFIG.COOKIES.SPOTIFY_REFRESH,
      AUTH_CONFIG.COOKIES.SPOTIFY_USER,
      AUTH_CONFIG.COOKIES.SPOTIFY_EXPIRES,
      AUTH_CONFIG.COOKIES.LASTFM_SESSION,
      AUTH_CONFIG.COOKIES.LASTFM_USERNAME,
      AUTH_CONFIG.COOKIES.APPLE_MUSIC_TOKEN
    ];
    
    // Delete all cookies with proper options
    cookiesToDelete.forEach(name => {
      cookieStore.set(name, '', {
        ...getCookieOptions(false),
        maxAge: 0,
        expires: new Date(0)
      });
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'Successfully logged out'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to logout'
      },
      { status: 500 }
    );
  }
}