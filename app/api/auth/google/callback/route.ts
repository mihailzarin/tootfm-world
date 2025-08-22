// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { AUTH_CONFIG, getRedirectUrl, getCookieOptions } from '@/lib/auth/config';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  getRedirectUrl('google')
);

export async function GET(request: NextRequest) {
  console.log('📍 Google callback started');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');
    
    if (error) {
      console.error('❌ Google OAuth error:', error);
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://tootfm.world/login?error=cancelled'
        : 'http://localhost:3001/login?error=cancelled';
      return NextResponse.redirect(redirectUrl);
    }
    
    if (!code) {
      console.error('❌ No authorization code received');
      const redirectUrl = process.env.NODE_ENV === 'production'
        ? 'https://tootfm.world/login?error=no_code'
        : 'http://localhost:3001/login?error=no_code';
      return NextResponse.redirect(redirectUrl);
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user data from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data } = await oauth2.userinfo.get();
    console.log('✅ Google user:', data.email);

    // Generate unique user ID
    const userId = `google_${data.id}`;
    
    // Find or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { worldId: userId }
    });
    
    if (!dbUser) {
      console.log('📝 Creating new user in database...');
      dbUser = await prisma.user.create({
        data: {
          worldId: userId,
          googleId: data.id,
          email: data.email,
          displayName: data.name || 'User',
          avatar: data.picture,
          verified: true,
          level: 'verified'
        }
      });
      console.log('✅ User created:', dbUser.id);
    } else {
      console.log('✅ Found existing user:', dbUser.id);
      // Update user data if needed
      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          email: data.email,
          displayName: data.name || dbUser.displayName,
          avatar: data.picture || dbUser.avatar,
          lastLogin: new Date()
        }
      });
    }
    
    // Redirect to profile page
    const profileUrl = process.env.NODE_ENV === 'production'
      ? 'https://tootfm.world/profile'
      : 'http://localhost:3001/profile';
      
    const response = NextResponse.redirect(profileUrl);
    
    // Set cookies with proper configuration
    response.cookies.set(AUTH_CONFIG.COOKIES.USER_ID, userId, {
      ...getCookieOptions(true),
      maxAge: AUTH_CONFIG.EXPIRATION.SESSION
    });

    response.cookies.set(AUTH_CONFIG.COOKIES.GOOGLE_USER, JSON.stringify({
      id: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture
    }), {
      ...getCookieOptions(false),
      maxAge: AUTH_CONFIG.EXPIRATION.SESSION
    });

    console.log('✅ Google authentication successful! Redirecting to profile');
    return response;

  } catch (error: any) {
    console.error('❌ Google callback error:', error.message);
    const errorUrl = process.env.NODE_ENV === 'production'
      ? 'https://tootfm.world/login?error=auth_failed'
      : 'http://localhost:3001/login?error=auth_failed';
    return NextResponse.redirect(errorUrl);
  }
}