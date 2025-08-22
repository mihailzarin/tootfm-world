'use client';

import { signIn, useSession } from 'next-auth/react';
import { useState } from 'react';

export default function SpotifyConnect() {
  const { data: session, status } = useSession();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Проверяем подключен ли Spotify
  const isSpotifyConnected = session?.user?.connectedServices?.spotify;
  
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Используем NextAuth signIn для Spotify
      await signIn('spotify', { 
        callbackUrl: window.location.pathname // Возвращаемся на текущую страницу
      });
    } catch (error) {
      console.error('Failed to connect Spotify:', error);
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      // Вызываем API для отключения Spotify
      const response = await fetch('/api/spotify/disconnect', {
        method: 'POST'
      });
      
      if (response.ok) {
        // Обновляем страницу чтобы увидеть изменения
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to disconnect Spotify:', error);
    }
  };
  
  // Если уже подключен
  if (isSpotifyConnected) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-green-400 font-medium">Spotify Connected</span>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-gray-400 hover:text-red-400 text-sm transition"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }
  
  // Кнопка подключения
  return (
    <button
      onClick={handleConnect}
      disabled={isConnecting || status === 'loading'}
      className={`
        block w-full font-bold py-3 px-4 rounded-lg transition text-center
        ${isConnecting || status === 'loading'
          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-400 text-black'
        }
      `}
    >
      {isConnecting ? 'Connecting...' : 'Connect Spotify'}
    </button>
  );
}