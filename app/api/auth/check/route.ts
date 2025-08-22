// app/api/auth/check/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_CONFIG } from '@/lib/auth/config';

export async function GET() {
  try {
    const cookieStore = cookies();
    
    // Check for user authentication using centralized cookie names
    const userId = cookieStore.get(AUTH_CONFIG.COOKIES.USER_ID);
    const googleUser = cookieStore.get(AUTH_CONFIG.COOKIES.GOOGLE_USER);
    const spotifyUser = cookieStore.get(AUTH_CONFIG.COOKIES.SPOTIFY_USER);
    const spotifyToken = cookieStore.get(AUTH_CONFIG.COOKIES.SPOTIFY_TOKEN);
    
    // User is authenticated if they have a user ID or any connected service
    const isAuthenticated = !!(userId || googleUser || spotifyUser);
    
    // Determine user level based on available services
    let userLevel = 'guest';
    if (googleUser) userLevel = 'verified';
    else if (spotifyUser || spotifyToken) userLevel = 'music';
    
    return NextResponse.json({
      authenticated: isAuthenticated,
      userId: userId?.value || null,
      userLevel,
      hasGoogle: !!googleUser,
      hasSpotify: !!spotifyUser,
      hasSpotifyToken: !!spotifyToken
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      userId: null,
      userLevel: 'guest',
      hasGoogle: false,
      hasSpotify: false,
      hasSpotifyToken: false
    });
  }
}