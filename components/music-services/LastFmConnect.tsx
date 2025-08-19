'use client';

import { useState, useEffect } from 'react';
import { Music, Loader2, CheckCircle, XCircle, Radio } from 'lucide-react';

interface LastFmConnectProps {
  onConnect?: (username: string) => void;
  onDisconnect?: () => void;
}

export default function LastFmConnect({ onConnect, onDisconnect }: LastFmConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('lastfm') === 'connected') {
      checkConnectionStatus();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const usernameFromCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('lastfm_username='));
      
      if (usernameFromCookie) {
        const user = usernameFromCookie.split('=')[1];
        setUsername(user);
        setIsConnected(true);
        if (onConnect) onConnect(user);
      }
    } catch (err) {
      console.error('Error checking Last.fm status:', err);
    }
  };

  const handleConnect = () => {
    setIsLoading(true);
    window.location.href = '/api/music/lastfm/connect';
  };

  const handleDisconnect = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/music/lastfm/disconnect', {
        method: 'POST'
      });

      if (response.ok) {
        setIsConnected(false);
        setUsername(null);
        if (onDisconnect) onDisconnect();
        
        // Clear cookies
        document.cookie = 'lastfm_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'lastfm_username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setIsLoading(false);
    }
  };

  if (isConnected && username) {
    return (
      <div className="bg-white/5 backdrop-blur rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium">Last.fm</h3>
              <p className="text-green-400 text-sm flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Connected
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="text-gray-400 hover:text-red-400 transition text-sm"
          >
            Disconnect
          </button>
        </div>
        
        <div className="bg-black/20 rounded-lg p-3">
          <p className="text-gray-400 text-xs mb-1">Username</p>
          <p className="text-white font-medium">{username}</p>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
          <Radio className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-medium">Last.fm</h3>
          <p className="text-gray-400 text-sm">Track your music history</p>
        </div>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-300">
        <p className="font-medium">With Last.fm you get:</p>
        <ul className="space-y-1 text-gray-400">
          <li className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Automatic track scrobbling
          </li>
          <li className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Detailed listening statistics
          </li>
          <li className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Music recommendations
          </li>
          <li className="flex items-center gap-2">
            <span className="text-purple-400">•</span>
            Complete listening history
          </li>
        </ul>
      </div>

      <button
        onClick={handleConnect}
        disabled={isLoading}
        className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Music className="w-4 h-4" />
            Connect Last.fm
          </>
        )}
      </button>

      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
