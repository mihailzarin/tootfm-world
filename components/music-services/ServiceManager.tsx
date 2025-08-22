'use client';

import { useEffect, useState } from 'react';
import LastFmConnect from './LastFmConnect';

interface ConnectedService {
  service: string;
  username?: string;
  connectedAt: string;
}

export default function ServiceManager() {
  const [services, setServices] = useState<ConnectedService[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnectedServices();
  }, []);

  const fetchConnectedServices = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
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
      console.error('Error disconnecting service:', error);
    }
  };

  const lastfmService = services.find(s => s.service === 'LASTFM');

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-900">Music Services</h2>
      
      {/* LastFmConnect управляет своим состоянием сам */}
      <LastFmConnect
        onDisconnect={() => handleDisconnect('lastfm')}
      />
      
      {/* Показываем статус если подключен */}
      {lastfmService && (
        <div className="text-sm text-gray-600">
          Connected as: {lastfmService.username}
        </div>
      )}
    </div>
  );
}
