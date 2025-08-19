// app/api/music/lastfm/connect/route.ts

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.LASTFM_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Last.fm API key not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tootfm.world';
    const callbackUrl = `${baseUrl}/api/music/lastfm/callback`;
    const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
    
    // HTML страница БЕЗ автоматического редиректа
    const htmlPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Connect Last.fm to tootFM</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
        }
        
        .container {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 3rem;
            max-width: 500px;
            width: 100%;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
        }
        
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
        
        .subtitle {
            opacity: 0.9;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        
        .steps {
            background: rgba(0,0,0,0.2);
            border-radius: 12px;
            padding: 1.5rem;
            margin: 2rem 0;
            text-align: left;
        }
        
        .step {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin: 1rem 0;
        }
        
        .step-number {
            background: rgba(255,255,255,0.2);
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            font-weight: bold;
        }
        
        .button {
            display: inline-block;
            background: #d51007;
            color: white;
            padding: 1rem 2.5rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 1.1rem;
            margin: 1rem 0;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(213,16,7,0.4);
        }
        
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(213,16,7,0.5);
        }
        
        .token-section {
            margin: 2rem 0;
            padding: 1.5rem;
            background: rgba(0,0,0,0.3);
            border-radius: 12px;
        }
        
        .token-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid rgba(255,255,255,0.3);
            background: rgba(255,255,255,0.1);
            border-radius: 8px;
            color: white;
            font-size: 1rem;
            margin: 0.5rem 0;
        }
        
        .token-input::placeholder {
            color: rgba(255,255,255,0.6);
        }
        
        .submit-button {
            background: #667eea;
            color: white;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            margin-top: 0.5rem;
        }
        
        .submit-button:hover {
            background: #5a67d8;
        }
        
        .back-link {
            color: rgba(255,255,255,0.8);
            text-decoration: none;
            margin-top: 2rem;
            display: inline-block;
        }
        
        .back-link:hover {
            color: white;
        }
        
        .warning {
            background: rgba(255,193,7,0.2);
            border: 1px solid rgba(255,193,7,0.4);
            border-radius: 8px;
            padding: 1rem;
            margin: 1.5rem 0;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">🎵</div>
        <h1>Connect Last.fm</h1>
        <p class="subtitle">Track your complete listening history</p>
        
        <div class="steps">
            <div class="step">
                <div class="step-number">1</div>
                <div>Click the button below to go to Last.fm</div>
            </div>
            <div class="step">
                <div class="step-number">2</div>
                <div>Authorize tootFM to access your Last.fm data</div>
            </div>
            <div class="step">
                <div class="step-number">3</div>
                <div>You'll see "Application authenticated"</div>
            </div>
            <div class="step">
                <div class="step-number">4</div>
                <div><strong>Copy the entire URL from your browser</strong></div>
            </div>
            <div class="step">
                <div class="step-number">5</div>
                <div>Come back here and paste it below</div>
            </div>
        </div>
        
        <a href="${authUrl}" target="_blank" class="button">
            Connect with Last.fm
        </a>
        
        <div class="warning">
            ⚠️ Last.fm will NOT redirect you back automatically. 
            You must copy the URL and paste it below.
        </div>
        
        <div class="token-section">
            <h3>Step 5: Paste the URL here</h3>
            <input 
                type="text" 
                id="tokenUrl" 
                class="token-input"
                placeholder="Paste the Last.fm URL here..."
            />
            <button onclick="processUrl()" class="submit-button">Complete Connection</button>
        </div>
        
        <a href="/profile" class="back-link">← Back to Profile</a>
    </div>
    
    <script>
        function processUrl() {
            const input = document.getElementById('tokenUrl');
            const url = input.value.trim();
            
            if (!url) {
                alert('Please paste the URL first');
                return;
            }
            
            // Extract token from URL
            let token = null;
            
            // Try different URL patterns
            const patterns = [
                /token=([^&]+)/,
                /\?token=([^&]+)/,
                /&token=([^&]+)/
            ];
            
            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    token = match[1];
                    break;
                }
            }
            
            if (!token) {
                alert('Could not find token in URL. Make sure you copied the complete URL.');
                return;
            }
            
            // Redirect to callback
            window.location.href = '${callbackUrl}?token=' + token;
        }
        
        // Check if Enter is pressed
        document.getElementById('tokenUrl').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                processUrl();
            }
        });
    </script>
</body>
</html>`;
    
    return new NextResponse(htmlPage, {
      headers: { 
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
    
  } catch (error) {
    console.error('Last.fm connect error:', error);
    return NextResponse.json({ error: 'Failed to initiate Last.fm connection' }, { status: 500 });
  }
}