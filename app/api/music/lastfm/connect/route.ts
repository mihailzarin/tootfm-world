import { NextRequest, NextResponse } from 'next/server';
import { LastFmAdapter } from '@/lib/music-services/lastfm';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    const apiSecret = process.env.LASTFM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'Last.fm API credentials not configured' },
        { status: 500 }
      );
    }

    const adapter = new LastFmAdapter(apiKey, apiSecret);
    
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/music/lastfm/callback`;
    const authUrl = await adapter.connect(redirectUri);
    
    // Возвращаем URL для редиректа
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Last.fm connect error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Last.fm connection' },
      { status: 500 }
    );
  }
}
