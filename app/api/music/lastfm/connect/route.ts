import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  
  // Если есть токен - обрабатываем callback
  if (token) {
    try {
      const apiKey = process.env.LASTFM_API_KEY!;
      const apiSecret = process.env.LASTFM_API_SECRET!;
      
      // Создаём подпись для получения сессии
      const sig = crypto
        .createHash('md5')
        .update(`api_key${apiKey}methodauth.getSessiontoken${token}${apiSecret}`)
        .digest('hex');
      
      // Получаем сессию
      const sessionUrl = `https://ws.audioscrobbler.com/2.0/?method=auth.getSession&api_key=${apiKey}&token=${token}&api_sig=${sig}&format=json`;
      const sessionResponse = await fetch(sessionUrl);
      const sessionData = await sessionResponse.json();
      
      if (sessionData.session) {
        // Создаём ответ с редиректом
        const response = NextResponse.redirect(new URL('/profile?lastfm=connected&tab=services', request.url));
        
        // Сохраняем сессию в cookies
        response.cookies.set('lastfm_session', sessionData.session.key, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365 // 1 год
        });
        
        response.cookies.set('lastfm_username', sessionData.session.name, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 365
        });
        
        return response;
      } else {
        return NextResponse.redirect(new URL('/profile?error=lastfm_connection_failed', request.url));
      }
    } catch (error) {
      console.error('Last.fm callback error:', error);
      return NextResponse.redirect(new URL('/profile?error=lastfm_error', request.url));
    }
  }
  
  // Показываем страницу подключения
  const apiKey = process.env.LASTFM_API_KEY;
  const callbackUrl = process.env.LASTFM_CALLBACK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/music/lastfm/connect`;
  const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Connect Last.fm to tootFM</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 100%;
                text-align: center;
                color: white;
            }
            h1 {
                margin: 0 0 10px;
                font-size: 2.5em;
            }
            .subtitle {
                opacity: 0.9;
                margin-bottom: 30px;
                font-size: 1.1em;
            }
            .steps {
                text-align: left;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 10px;
                padding: 20px;
                margin: 30px 0;
            }
            .step {
                margin: 15px 0;
                display: flex;
                align-items: flex-start;
            }
            .step-number {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 15px;
                flex-shrink: 0;
                font-weight: bold;
            }
            .button {
                display: inline-block;
                background: #d51007;
                color: white;
                padding: 15px 40px;
                border-radius: 50px;
                text-decoration: none;
                font-weight: bold;
                font-size: 1.1em;
                margin: 20px 0;
                transition: transform 0.2s, box-shadow 0.2s;
            }
            .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
            }
            .back-link {
                color: white;
                text-decoration: none;
                opacity: 0.8;
                margin-top: 20px;
                display: inline-block;
            }
            .back-link:hover {
                opacity: 1;
            }
        </style>
    </head>
    <body>
    <div class="container">
        <h1>🎵 Connect Last.fm</h1>
        <p class="subtitle">Sync your music history with tootFM</p>
        
        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div>Click the button below to go to Last.fm</div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div>Log in to your Last.fm account</div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div>Authorize tootFM to access your data</div>
            </div>
            <div class="step">
                <div class="step-number">4</div>
                <div>You'll be redirected back automatically</div>
            </div>
        </div>
        
        <a href="${authUrl}" class="button">
            Connect with Last.fm
        </a>
        
        <br>
        <a href="/profile" class="back-link">← Back to Profile</a>
    </div>
    </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}
