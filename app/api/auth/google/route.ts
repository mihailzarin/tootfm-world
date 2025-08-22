// app/api/auth/google/route.ts
import { NextResponse } from 'next/server';
import { AUTH_CONFIG, getRedirectUrl } from '@/lib/auth/config';

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('❌ GOOGLE_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Google OAuth not configured' },
        { status: 500 }
      );
    }

    const redirectUri = getRedirectUrl('google');
    
    // Required scopes for the application
    const scopes = [
      'openid',
      'email', 
      'profile',
      'https://www.googleapis.com/auth/youtube.readonly'
    ].join(' ');

    // Generate state parameter for CSRF protection
    const state = generateRandomString(32);

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `access_type=offline&` +
      `prompt=consent&` +
      `state=${state}`;

    console.log('🎵 Google OAuth initiated');
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('❌ Google OAuth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google OAuth' },
      { status: 500 }
    );
  }
}

// Generate random string for state parameter
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  
  return text;
}