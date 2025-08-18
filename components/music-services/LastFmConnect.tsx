// components/music-services/LastFmConnect.tsx
// Компонент для подключения Last.fm с улучшенным UI и обработкой ошибок

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

  // Проверяем статус подключения при загрузке
  useEffect(() => {
    checkConnectionStatus();
    
    // Проверяем параметры URL на предмет успешного подключения или ошибки
    const params = new URLSearchParams(window.location.search);
    if (params.get('lastfm') === 'connected') {
      checkConnectionStatus();
      // Очищаем параметры URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('error') === 'lastfm_connection_failed') {
      setError('Не удалось подключить Last.fm. Попробуйте еще раз.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  /**
   * Проверяет статус подключения Last.fm
   */
  const checkConnectionStatus = () => {
    // Проверяем наличие username в cookies (можно читать на клиенте)
    const cookies = document.cookie.split(';');
    const usernameCookie = cookies.find(c => c.trim().startsWith('lastfm_username='));
    const userDataCookie = cookies.find(c => c.trim().startsWith('lastfm_user='));
    
    if (usernameCookie) {
      const cookieUsername = decodeURIComponent(usernameCookie.split('=')[1]);
      setIsConnected(true);
      setUsername(cookieUsername);
      setError(null);
      
      if (onConnect) {
        onConnect(cookieUsername);
      }
    } else if (userDataCookie) {
      // Пробуем получить из lastfm_user cookie
      try {
        const userData = JSON.parse(decodeURIComponent(userDataCookie.split('=')[1]));
        if (userData.username) {
          setIsConnected(true);
          setUsername(userData.username);
          setError(null);
          
          if (onConnect) {
            onConnect(userData.username);
          }
        }
      } catch (e) {
        console.error('Error parsing lastfm_user cookie:', e);
      }
    } else {
      setIsConnected(false);
      setUsername(null);
    }
  };

  /**
   * Начинает процесс подключения Last.fm
   */
  const handleConnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Редиректим на endpoint авторизации
      window.location.href = '/api/lastfm/auth';
    } catch (error) {
      console.error('Error connecting Last.fm:', error);
      setError('Не удалось начать авторизацию');
      setIsLoading(false);
    }
  };

  /**
   * Отключает Last.fm
   */
  const handleDisconnect = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/lastfm/auth', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }
      
      setIsConnected(false);
      setUsername(null);
      
      // Удаляем cookies на клиенте тоже
      document.cookie = 'lastfm_username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      
      if (onDisconnect) {
        onDisconnect();
      }
    } catch (error) {
      console.error('Error disconnecting Last.fm:', error);
      setError('Не удалось отключить Last.fm');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 rounded-xl p-6 backdrop-blur-sm border border-red-500/20">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-3 rounded-full">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Last.fm</h3>
            <p className="text-gray-400 text-sm">Скробблинг и музыкальная статистика</p>
          </div>
        </div>
        
        {isConnected && (
          <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
        )}
      </div>

      {/* Статус подключения */}
      {isConnected && username && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Подключено как <span className="font-bold ml-1">{username}</span>
          </p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm flex items-center">
            <XCircle className="h-4 w-4 mr-2" />
            {error}
          </p>
        </div>
      )}

      {/* Возможности Last.fm */}
      {!isConnected && (
        <div className="mb-4 space-y-2">
          <p className="text-gray-300 text-sm">С Last.fm вы получите:</p>
          <ul className="space-y-1 text-gray-400 text-sm">
            <li className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              Автоматический скробблинг треков
            </li>
            <li className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              Детальная статистика прослушиваний
            </li>
            <li className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              Музыкальные рекомендации
            </li>
            <li className="flex items-center">
              <span className="text-red-500 mr-2">•</span>
              История всех вечеринок
            </li>
          </ul>
        </div>
      )}

      {/* Кнопка действия */}
      {isConnected ? (
        <button
          onClick={handleDisconnect}
          disabled={isLoading}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Отключение...
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 mr-2" />
              Отключить Last.fm
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleConnect}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transform hover:scale-105"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Подключение...
            </>
          ) : (
            <>
              <Music className="h-5 w-5 mr-2" />
              Подключить Last.fm
            </>
          )}
        </button>
      )}

      {/* Дополнительная информация */}
      {isConnected && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-gray-400 text-xs">
            Last.fm будет автоматически записывать все треки, 
            которые играют на вечеринках tootFM
          </p>
        </div>
      )}
    </div>
  );
}