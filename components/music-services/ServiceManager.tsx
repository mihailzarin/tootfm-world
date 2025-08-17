'use client';

import { useEffect, useState } from 'react';
import LastFmConnect from './LastFmConnect';

interface ConnectedService {
  service: string;
  username?: string;
  connectedAt: string;
}

export default function ServiceManager({ userId }: { userId?: string }) {
  const [connectedServices, setConnectedServices] = useState<ConnectedService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchConnectedServices();
  }, [userId]);

  const fetchConnectedServices = async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/music/services');
      if (response.ok) {
        const data = await response.json();
        setConnectedServices(data.services || []);
      }
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async (service: string) => {
    try {
      const response = await fetch(`/api/music/${service}/disconnect`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchConnectedServices();
      }
    } catch (error) {
      console.error(`Failed to disconnect ${service}:`, error);
    }
  };

  const lastfmService = connectedServices.find(s => s.service === 'LASTFM');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
        <div className="animate-pulse bg-gray-200 rounded-lg h-20"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Music Services</h2>
      
      <LastFmConnect
        isConnected={!!lastfmService}
        username={lastfmService?.username}
        onDisconnect={() => handleDisconnect('lastfm')}
      />
      
      {/* Здесь можно добавить другие сервисы */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Spotify</h3>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
          <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
            Connect
          </button>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 opacity-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">A</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Apple Music</h3>
              <p className="text-sm text-gray-600">Coming soon</p>
            </div>
          </div>
          <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
