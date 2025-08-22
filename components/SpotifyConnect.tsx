"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Music } from 'lucide-react';

export default function SpotifyConnect() {
  const { data: session, status } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Проверяем подключение через session
    if (session?.user) {
      const connected = (session.user as any).connectedServices?.spotify || false;
      setIsConnected(connected);
      console.log('[SpotifyConnect] Session status:', { connected, session });
    }
  }, [session]);

  // Функция для диагностики
  const runDiagnostics = async () => {
    try {
      const response = await fetch('/api/auth/debug');
      const data = await response.json();
      setDebugInfo(data);
      console.log('[SpotifyConnect] Debug info:', data);
    } catch (err) {
      console.error('[SpotifyConnect] Debug error:', err);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError(null);
      
      console.log('[SpotifyConnect] Starting Spotify connection...');
      
      // Сначала проверим debug info
      await runDiagnostics();
      
      // Используем NextAuth signIn
      const result = await signIn('spotify', {
        redirect: false,
        callbackUrl: '/profile'
      });
      
      console.log('[SpotifyConnect] SignIn result:', result);
      
      if (result?.error) {
        // Специфичные сообщения для разных ошибок
        if (result.error === 'Callback') {
          setError('Spotify authorization failed. Please check if the app is configured correctly.');
          console.error('[SpotifyConnect] Callback error - likely redirect URI mismatch');
        } else if (result.error === 'AccessDenied') {
          setError('You denied access to Spotify. Please try again and click "Agree".');
        } else if (result.error === 'Configuration') {
          setError('Spotify is not configured properly. Please contact support.');
        } else {
          setError(`Connection failed: ${result.error}`);
        }
      } else if (result?.url) {
        // Если есть URL, делаем редирект вручную
        console.log('[SpotifyConnect] Redirecting to:', result.url);
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('[SpotifyConnect] Connection error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const response = await fetch('/api/spotify/disconnect', {
        method: 'POST',
      });
      
      if (response.ok) {
        setIsConnected(false);
        // Обновляем страницу для перезагрузки session
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('[SpotifyConnect] Disconnect error:', error);
      setError('Failed to disconnect Spotify');
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 bg-[#1DB954]/10 rounded-xl border border-[#1DB954]/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Music className="w-8 h-8 text-[#1DB954]" />
            <div>
              <h3 className="text-lg font-semibold">Spotify</h3>
              <p className="text-sm text-gray-600">
                {isConnected ? 'Connected' : 'Connect your Spotify account'}
              </p>
            </div>
          </div>
          
          {isConnected ? (
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
            >
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting || status === 'loading'}
              className="px-4 py-2 bg-[#1DB954] hover:bg-[#1DB954]/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect Spotify'}
            </button>
          )}
        </div>
        
        {error && (
          <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {/* Debug info */}
        {debugInfo && (
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-gray-500">
              Debug Information
            </summary>
            <pre className="mt-2 p-2 bg-black/5 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
      
      {/* Кнопка для диагностики (временно) */}
      <button
        onClick={runDiagnostics}
        className="text-xs opacity-50 hover:opacity-100 transition-opacity"
      >
        Run Diagnostics
      </button>
    </div>
  );
}