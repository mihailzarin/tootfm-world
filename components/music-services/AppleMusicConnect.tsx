'use client';

import { useState, useEffect } from 'react';
import Script from 'next/script';

declare global {
  interface Window {
    MusicKit: any;
  }
}

export default function AppleMusicConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [musicKit, setMusicKit] = useState<any>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/music/apple/status', {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setIsConnected(data.connected);
      }
    } catch (error) {
      console.error('Failed to check Apple Music status');
    }
  };

  const initializeMusicKit = async () => {
    if (!window.MusicKit) {
      console.error('MusicKit not loaded');
      return null;
    }

    try {
      // Получаем developer token с сервера
      const tokenRes = await fetch('/api/music/apple/token', {
        credentials: 'include'
      });
      
      if (!tokenRes.ok) {
        throw new Error('Failed to get developer token');
      }
      
      const { token } = await tokenRes.json();
      
      // Конфигурируем MusicKit
      const music = await window.MusicKit.configure({
        developerToken: token,
        app: {
          name: 'tootFM',
          build: '1.0.0'
        }
      });
      
      setMusicKit(music);
      return music;
    } catch (error) {
      console.error('Failed to initialize MusicKit:', error);
      throw error;
    }
  };

  const handleConnect = async () => {
    setIsLoading(true);
    
    try {
      // Инициализируем MusicKit если нужно
      let music = musicKit;
      if (!music) {
        music = await initializeMusicKit();
        if (!music) {
          throw new Error('Failed to initialize Apple Music');
        }
      }
      
      // Авторизуем пользователя
      const userToken = await music.authorize();
      console.log('User authorized with Apple Music');
      
      // Сохраняем токен на сервере
      const response = await fetch('/api/music/apple/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userToken })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save Apple Music connection');
      }
      
      setIsConnected(true);
      
      // Перезагружаем страницу для обновления Music Portrait
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error: any) {
      console.error('Apple Music connection failed:', error);
      
      // Показываем пользователю ошибку
      if (error.message?.includes('User cancelled')) {
        console.log('User cancelled Apple Music authorization');
      } else {
        alert('Failed to connect Apple Music. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/music/apple/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        if (musicKit) {
          await musicKit.unauthorize();
        }
        setIsConnected(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Script 
        src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('MusicKit.js loaded');
          setIsScriptLoaded(true);
        }}
        onError={(e) => {
          console.error('Failed to load MusicKit.js:', e);
        }}
      />
      
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-red-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03a12.5 12.5 0 001.57-.1 5.374 5.374 0 002.162-.76c1.042-.657 1.796-1.56 2.246-2.67.252-.62.357-1.26.402-1.913.023-.326.028-.651.028-.978V6.126l-.006-.002zm-3.842 9.57c0 .606-.007 1.21-.026 1.815-.028.874-.195 1.71-.731 2.428-.58.773-1.386 1.163-2.325 1.287-.37.05-.742.062-1.115.062H7.044c-.372 0-.744-.012-1.114-.062-.94-.124-1.747-.514-2.327-1.287-.536-.718-.703-1.554-.73-2.428-.02-.604-.027-1.21-.027-1.815V8.316c0-.605.007-1.21.026-1.815.028-.874.195-1.71.731-2.428.58-.773 1.386-1.162 2.325-1.287.37-.05.742-.062 1.115-.062h8.911c.372 0 .744.012 1.114.062.94.125 1.747.514 2.327 1.287.536.718.703 1.554.73 2.428.02.605.027 1.21.027 1.815v7.378z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold">Apple Music</h3>
              <p className="text-gray-400 text-sm">
                {isConnected ? "Connected" : isScriptLoaded ? "Stream your library" : "Loading..."}
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "..." : "Disconnect"}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading || !isScriptLoaded}
              className="px-4 py-2 bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-700 hover:to-red-700 text-white rounded-lg transition-all disabled:opacity-50"
            >
              {isLoading ? "Connecting..." : !isScriptLoaded ? "Loading..." : "Connect"}
            </button>
          )}
        </div>
        
        {!isConnected && isScriptLoaded && (
          <p className="text-xs text-gray-500 mt-3">
            Connect to sync your Apple Music library and playlists
          </p>
        )}
      </div>
    </>
  );
}
