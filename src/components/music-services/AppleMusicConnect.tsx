'use client';

import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';

declare global {
  interface Window {
    MusicKit: any;
  }
}

export default function AppleMusicConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicKitLoaded, setMusicKitLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedToken = localStorage.getItem('apple_music_token');
    if (savedToken) {
      setIsConnected(true);
    }
    loadMusicKit();
  }, []);

  const loadMusicKit = async () => {
    try {
      if (window.MusicKit) {
        await initializeMusicKit();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      script.onload = () => initializeMusicKit();
      script.onerror = () => setError('Failed to load Apple Music');
      document.head.appendChild(script);
    } catch (err) {
      setError('Error loading Apple Music');
    }
  };

  const initializeMusicKit = async () => {
    try {
      const response = await fetch('/api/music/apple/token');
      const data = await response.json();
      
      if (!data.success) {
        setError('Failed to get authorization token');
        return;
      }

      await window.MusicKit.configure({
        developerToken: data.token,
        app: {
          name: 'tootFM',
          build: '1.0.0'
        }
      });

      setMusicKitLoaded(true);
      console.log('✅ MusicKit loaded');
    } catch (error) {
      console.error('❌ MusicKit error:', error);
      setError('Failed to initialize Apple Music');
    }
  };

  const handleConnect = async () => {
    if (!musicKitLoaded) {
      alert('Apple Music is still loading...');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const music = window.MusicKit.getInstance();
      const userToken = await music.authorize();
      
      if (userToken) {
        localStorage.setItem('apple_music_token', userToken);
        setIsConnected(true);
        window.location.reload();
      }
    } catch (error: any) {
      console.error('❌ Connection error:', error);
      setError('Apple Music subscription required');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('apple_music_token');
    setIsConnected(false);
    window.location.reload();
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Apple Music</h3>
            <p className="text-gray-400 text-sm">
              {isConnected ? 'Connected' : 'Library and playlists'}
            </p>
          </div>
        </div>
        
        {!musicKitLoaded ? (
          <div className="text-gray-400 text-sm">Loading...</div>
        ) : isConnected ? (
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
          >
            Disconnect
          </button>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {isConnected && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-green-400 text-sm">✓ Apple Music connected</p>
        </div>
      )}

      {!isConnected && !error && (
        <div className="mt-4 text-gray-500 text-xs space-y-1">
          <p className="font-medium text-gray-400">Requirements:</p>
          <ul className="space-y-0.5">
            <li>• Active Apple Music subscription</li>
            <li>• Signed in to Apple ID</li>
            <li>• iCloud Music Library enabled</li>
          </ul>
        </div>
      )}
    </div>
  );
}
