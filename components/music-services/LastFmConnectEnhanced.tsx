'use client';

import { useState } from 'react';

interface LastFmConnectEnhancedProps {
  username?: string;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function LastFmConnectEnhanced({ 
  username,
  onConnect,
  onDisconnect 
}: LastFmConnectEnhancedProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Используем настоящую OAuth авторизацию
      window.location.href = '/api/music/lastfm/connect';
    } catch (error) {
      console.error('Failed to connect Last.fm:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-black/30 rounded-xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <div>
          <h3 className="text-white font-bold">Last.fm</h3>
          <p className="text-gray-400 text-sm">
            {username ? `Connected: ${username}` : "Track your listening history"}
          </p>
        </div>
      </div>
      {username ? (
        <button
          onClick={onDisconnect}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-4 py-2 rounded-full transition-all"
        >
          Disconnect
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full transition-all"
        >
          {isLoading ? "Connecting..." : "Connect"}
        </button>
      )}
    </div>
  );
}
