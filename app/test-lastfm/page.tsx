'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function TestLastFmPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<string>('Ready to test');
  const [lastfmUser, setLastfmUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const lastfm = searchParams.get('lastfm');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    
    if (lastfm === 'connected') {
      setStatus(`✅ Last.fm connected successfully${username ? ' as ' + username : ''}!`);
      
      // Читаем cookie с реальными данными
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
      };
      
      const lastfmCookie = getCookie('lastfm_user');
      if (lastfmCookie) {
        try {
          const user = JSON.parse(decodeURIComponent(lastfmCookie));
          setLastfmUser(user);
          localStorage.setItem('lastfm_connected', 'true');
          localStorage.setItem('lastfm_data', JSON.stringify(user));
        } catch (e) {
          console.error('Error parsing Last.fm cookie:', e);
        }
      }
    } else if (error) {
      setStatus(`❌ Error: ${error}`);
    }
    
    // Проверяем сохраненные данные
    const savedData = localStorage.getItem('lastfm_data');
    if (savedData && !lastfmUser) {
      try {
        setLastfmUser(JSON.parse(savedData));
        setStatus('✅ Last.fm connected (from cache)');
      } catch (e) {
        console.error('Error loading saved data:', e);
      }
    }
  }, [searchParams]);

  const connectLastFm = () => {
    setIsLoading(true);
    setStatus('Redirecting to Last.fm...');
    window.location.href = '/api/music/lastfm/connect';
  };

  const disconnect = () => {
    localStorage.removeItem('lastfm_connected');
    localStorage.removeItem('lastfm_data');
    document.cookie = 'lastfm_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setLastfmUser(null);
    setStatus('Disconnected');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            🧪 Test Last.fm Integration
          </h1>
          
          <div className="mb-6 p-4 bg-black/30 rounded-xl">
            <p className="text-white font-mono text-sm">Status: {status}</p>
          </div>

          {!lastfmUser ? (
            <button
              onClick={connectLastFm}
              disabled={isLoading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all"
            >
              {isLoading ? 'Connecting...' : 'Connect Last.fm (Real OAuth)'}
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-500/20 border border-green-500 rounded-xl p-4">
                <h3 className="text-green-400 font-bold mb-2">✅ Connected!</h3>
                <div className="text-white space-y-2">
                  <p><strong>Username:</strong> {lastfmUser.username}</p>
                  {lastfmUser.profile && (
                    <>
                      <p><strong>Display Name:</strong> {lastfmUser.profile.displayName || 'N/A'}</p>
                      <p><strong>Country:</strong> {lastfmUser.profile.country || 'N/A'}</p>
                      <p><strong>Scrobbles:</strong> {lastfmUser.profile.followers || 0}</p>
                    </>
                  )}
                  <p className="text-xs text-gray-400 font-mono">
                    Session: {lastfmUser.sessionKey?.substring(0, 20)}...
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={disconnect}
                  className="bg-red-600/20 hover:bg-red-600/30 text-red-300 py-3 rounded-xl font-bold transition-all"
                >
                  Disconnect
                </button>
                
                <button
                  onClick={() => window.location.href = '/profile'}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-xl font-bold transition-all"
                >
                  Back to Profile
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-500/20 rounded-xl">
            <p className="text-yellow-300 text-sm">
              ⚠️ Test page - No database saves yet
            </p>
            <p className="text-green-300 text-sm mt-2">
              ✅ Last.fm OAuth is working! Ready to integrate with main profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
