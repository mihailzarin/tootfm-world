// app/api/spotify/auth/route.ts
import { NextResponse } from 'next/server';
import { getRedirectUrl } from '@/lib/auth/config';

export async function GET() {
  try {
    const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    
    if (!CLIENT_ID) {
      console.error('❌ SPOTIFY_CLIENT_ID not configured');
      return NextResponse.json(
        { error: 'Spotify is not configured. Please contact support.' },
        { status: 500 }
      );
    }
    
    const REDIRECT_URI = getRedirectUrl('spotify');
    
    // Required scopes for full functionality
    const scopes = [
      // Basic scopes
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-library-read',
      
      // Playback scopes
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      
      // Playlist scopes
      'playlist-read-private',
      'playlist-read-collaborative',
      'playlist-modify-public',
      'playlist-modify-private',
      
      // Additional scopes
      'user-read-recently-played',
      'user-follow-read',
      'user-follow-modify'
    ];
    
    // Generate state parameter for CSRF protection
    const state = generateRandomString(32);
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope: scopes.join(' '),
      redirect_uri: REDIRECT_URI,
      show_dialog: 'false',
      state: state
    });

    const authUrl = `https://accounts.spotify.com/authorize?${params}`;
    
    console.log('🎵 Spotify Auth initiated');
    console.log('📝 Requested scopes:', scopes.length, 'permissions');
    console.log('🔗 Redirect URI:', REDIRECT_URI);
    console.log('✅ Environment:', process.env.NODE_ENV);
    
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('❌ Spotify auth initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Spotify authentication' },
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