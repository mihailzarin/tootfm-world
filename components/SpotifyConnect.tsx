"use client";

import { useState, useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Music } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function SpotifyConnect() {
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

  // Показываем debug информацию в development
  const isDev = process.env.NODE_ENV === 'development';

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
            <Button
              onClick={handleDisconnect}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              Disconnect
            </Button>
          ) : (
            <Button
              onClick={handleConnect}
              disabled={isConnecting || status === 'loading'}
              className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white"
            >
              {isConnecting ? 'Connecting...' : 'Connect Spotify'}
            </Button>
          )}
        </div>
        
        {error && (
          <Alert className="mt-4 border-red-500/50 bg-red-500/10">
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Debug info в development */}
        {isDev && debugInfo && (
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
      <Button
        onClick={runDiagnostics}
        variant="ghost"
        size="sm"
        className="text-xs opacity-50"
      >
        Run Diagnostics
      </Button>
    </div>
  );
}