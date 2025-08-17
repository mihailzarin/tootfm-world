import { NextRequest, NextResponse } from 'next/server';
import { LastFmAdapter } from '@/lib/music-services/lastfm';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    const apiSecret = process.env.LASTFM_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Last.fm API credentials not configured' }, { status: 500 });
    }

    const adapter = new LastFmAdapter(apiKey, apiSecret);
    
    // Автоматический callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
    const callbackUrl = `${baseUrl}/api/music/lastfm/callback`;
    
    const authUrl = await adapter.connect(callbackUrl);
    
    // Добавляем инструкцию для пользователя
    const htmlPage = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Connecting to Last.fm...</title>
        <style>
          body {
            background: linear-gradient(to bottom, #581c87, #000);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255,255,255,0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            max-width: 500px;
          }
          h1 { margin-bottom: 1rem; }
          p { margin: 1rem 0; opacity: 0.9; }
          .button {
            display: inline-block;
            background: #dc2626;
            color: white;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            text-decoration: none;
            font-weight: bold;
            margin: 1rem;
            transition: opacity 0.2s;
          }
          .button:hover { opacity: 0.9; }
          .code {
            background: rgba(0,0,0,0.5);
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            font-family: monospace;
            display: inline-block;
            margin: 0.5rem 0;
          }
        </style>
        <script>
          // Автоматический редирект
          setTimeout(() => {
            window.location.href = '${authUrl}';
          }, 1000);
          
          // Проверяем URL каждую секунду
          setInterval(() => {
            // Если в URL появился token, автоматически переходим на callback
            if (window.location.href.includes('token=')) {
              const url = new URL(window.location.href);
              const token = url.searchParams.get('token');
              if (token) {
                window.location.href = '${callbackUrl}?token=' + token;
              }
            }
          }, 1000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>🎵 Connecting to Last.fm</h1>
          <p>You will be redirected to Last.fm authorization...</p>
          <p style="font-size: 0.9rem; opacity: 0.7;">After authorizing, you'll be automatically returned to tootFM</p>
          
          <div style="margin-top: 2rem;">
            <p>If not redirected automatically:</p>
            <a href="${authUrl}" class="button">Click here to continue</a>
          </div>
          
          <div style="margin-top: 2rem; font-size: 0.8rem; opacity: 0.6;">
            <p>After authorizing on Last.fm, the page will show "Application authenticated"</p>
            <p>Copy the token from URL and return to tootFM</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    return new NextResponse(htmlPage, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error) {
    console.error('Last.fm connect error:', error);
    return NextResponse.json({ error: 'Failed to initiate Last.fm connection' }, { status: 500 });
  }
}
