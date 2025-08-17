'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface LastFmConnectProps {
  isConnected?: boolean;
  username?: string;
  onDisconnect?: () => void;
}

export default function LastFmConnect({ 
  isConnected = false, 
  username,
  onDisconnect 
}: LastFmConnectProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      // Перенаправляем на API endpoint для начала авторизации
      window.location.href = '/api/music/lastfm/connect';
    } catch (error) {
      console.error('Failed to connect Last.fm:', error);
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnect) {
      setIsLoading(true);
      try {
        await onDisconnect();
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (isConnected) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">L</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Last.fm</h3>
              <p className="text-sm text-gray-600">
                Connected as {username || 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isLoading ? 'Disconnecting...' : 'Disconnect'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">L</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Last.fm</h3>
            <p className="text-sm text-gray-600">
              Track your listening history
            </p>
          </div>
        </div>
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Connecting...' : 'Connect'}
        </button>
      </div>
    </div>
  );
}
