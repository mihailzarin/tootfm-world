'use client';

import { useState, useEffect } from 'react';
import { Music2, Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SpotifyConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<any>(null);

  useEffect(() => {
    checkConnection();
    handleCallback();
  }, []);

  const checkConnection = () => {
    const storedUser = localStorage.getItem('spotify_user');
    const storedTokens = localStorage.getItem('spotify_tokens');
    
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setSpotifyUser(userData);
        setIsConnected(true);
      } catch (e) {
        console.error('Error parsing Spotify user data:', e);
      }
    }

    // Проверяем токены
    if (storedTokens) {
      try {
        const tokens = JSON.parse(storedTokens);
        // Проверяем не истёк ли токен
        if (tokens.expires_at && new Date(tokens.expires_at) > new Date()) {
          setIsConnected(true);
        } else {
          // Токен истёк
          localStorage.removeItem('spotify_tokens');
          setIsConnected(false);
        }
      } catch (e) {
        console.error('Error parsing Spotify tokens:', e);
      }
    }
  };

  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    
    if (!code || !state) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/spotify/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, state }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        // Сохраняем данные пользователя
        localStorage.setItem('spotify_user', JSON.stringify(data.user));
        setSpotifyUser(data.user);
        
        // ВАЖНО: Сохраняем токены
        if (data.tokens) {
          localStorage.setItem('spotify_tokens', JSON.stringify(data.tokens));
        }
        
        setIsConnected(true);
        
        // Очищаем URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error handling Spotify callback:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectSpotify = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    const state = Math.random().toString(36).substring(7);
    const scope = encodeURIComponent('user-read-private user-read-email user-top-read user-library-read streaming user-read-playback-state user-modify-playback-state playlist-modify-public playlist-modify-private');
    
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
    
    window.location.href = authUrl;
  };

  const disconnectSpotify = async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/spotify/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      
      localStorage.removeItem('spotify_user');
      localStorage.removeItem('spotify_tokens');
      setSpotifyUser(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-lg">
            <Music2 className="w-6 h-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Spotify</h3>
            {isConnected && spotifyUser && (
              <p className="text-sm text-gray-400">Connected as {spotifyUser.display_name || spotifyUser.id}</p>
            )}
          </div>
        </div>
        
        {isConnected && (
          <CheckCircle className="w-5 h-5 text-green-400" />
        )}
      </div>

      {!isConnected ? (
        <button
          onClick={connectSpotify}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Music2 className="w-4 h-4" />
              Connect Spotify
            </>
          )}
        </button>
      ) : (
        <button
          onClick={disconnectSpotify}
          disabled={isLoading}
          className="w-full bg-white/10 hover:bg-white/20 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Disconnecting...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Disconnect
            </>
          )}
        </button>
      )}
    </div>
  );
}