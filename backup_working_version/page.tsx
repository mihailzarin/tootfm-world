'use client';

import React, { useState, useEffect } from 'react';
import { Music, Play, Youtube, Radio, User, TrendingUp, Heart, Clock, Disc, Headphones, BarChart3, Sparkles } from 'lucide-react';

interface MusicService {
  id: string;
  name: string;
  icon: React.ReactNode;
  connected: boolean;
  color: string;
  bgGradient: string;
  lastSync?: string;
  tracksImported?: number;
}

interface MusicProfile {
  topGenres: { name: string; percentage: number; color: string }[];
  topArtists: { name: string; plays: number; image?: string }[];
  topTracks: { title: string; artist: string; plays: number }[];
  listeningHours: number;
  totalTracks: number;
  musicPersonality: string;
  energyLevel: number;
  diversityScore: number;
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('services');
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [services, setServices] = useState<MusicService[]>([
    {
      id: 'spotify',
      name: 'Spotify',
      icon: <Play className="w-6 h-6" />,
      connected: false,
      color: '#1DB954',
      bgGradient: 'from-green-500 to-green-600'
    },
    {
      id: 'apple',
      name: 'Apple Music',
      icon: <Music className="w-6 h-6" />,
      connected: false,
      color: '#FC3C44',
      bgGradient: 'from-red-500 to-pink-500'
    },
    {
      id: 'lastfm',
      name: 'Last.fm',
      icon: <Radio className="w-6 h-6" />,
      connected: false,
      color: '#D51007',
      bgGradient: 'from-red-600 to-red-700'
    },
    {
      id: 'youtube',
      name: 'YouTube Music',
      icon: <Youtube className="w-6 h-6" />,
      connected: false,
      color: '#FF0000',
      bgGradient: 'from-red-500 to-red-600'
    }
  ]);

  const [musicProfile] = useState<MusicProfile>({
    topGenres: [
      { name: 'Electronic', percentage: 35, color: '#8B5CF6' },
      { name: 'Indie Rock', percentage: 25, color: '#3B82F6' },
      { name: 'Hip-Hop', percentage: 20, color: '#10B981' },
      { name: 'Pop', percentage: 15, color: '#F59E0B' },
      { name: 'Jazz', percentage: 5, color: '#EF4444' }
    ],
    topArtists: [
      { name: 'Daft Punk', plays: 1234 },
      { name: 'Arctic Monkeys', plays: 987 },
      { name: 'Kendrick Lamar', plays: 876 },
      { name: 'The Weeknd', plays: 765 },
      { name: 'Tame Impala', plays: 654 }
    ],
    topTracks: [
      { title: 'One More Time', artist: 'Daft Punk', plays: 123 },
      { title: 'Do I Wanna Know?', artist: 'Arctic Monkeys', plays: 98 },
      { title: 'HUMBLE.', artist: 'Kendrick Lamar', plays: 87 }
    ],
    listeningHours: 1247,
    totalTracks: 5432,
    musicPersonality: 'Eclectic Explorer',
    energyLevel: 72,
    diversityScore: 85
  });

  const handleConnect = async (serviceId: string) => {
    setIsConnecting(serviceId);
    // Симуляция подключения - НЕ РЕАЛЬНОЕ ПОДКЛЮЧЕНИЕ
    setTimeout(() => {
      setServices(prev => prev.map(s => 
        s.id === serviceId 
          ? { 
              ...s, 
              connected: true, 
              lastSync: new Date().toISOString(),
              tracksImported: Math.floor(Math.random() * 2000) + 500
            }
          : s
      ));
      setIsConnecting(null);
    }, 2000);
  };

  const handleDisconnect = (serviceId: string) => {
    setServices(prev => prev.map(s => 
      s.id === serviceId 
        ? { ...s, connected: false, lastSync: undefined, tracksImported: undefined }
        : s
    ));
  };

  const connectedCount = services.filter(s => s.connected).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">My Music Profile</h1>
                <p className="text-gray-400 mt-1">
                  {connectedCount > 0 
                    ? `Connected services: ${connectedCount}/4`
                    : 'Connect your music services to get started'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className="text-gray-400 text-sm">World ID</p>
                <p className="text-white font-mono text-xs">0x1234...5678</p>
              </div>
              <button className="bg-white/10 backdrop-blur p-2 rounded-lg hover:bg-white/20 transition">
                <Sparkles className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex space-x-1 bg-white/5 backdrop-blur rounded-xl p-1">
          {[
            { id: 'services', label: 'Services', icon: <Headphones className="w-4 h-4" /> },
            { id: 'profile', label: 'Music Portrait', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'stats', label: 'Statistics', icon: <TrendingUp className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all
                ${activeTab === tab.id 
                  ? 'bg-white/20 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {tab.icon}
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 mt-8 pb-12">
        {activeTab === 'services' && (
          <div className="grid md:grid-cols-2 gap-6">
            {services.map(service => (
              <div
                key={service.id}
                className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`
                      w-14 h-14 rounded-xl bg-gradient-to-br ${service.bgGradient} 
                      flex items-center justify-center text-white shadow-lg
                    `}>
                      {service.icon}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{service.name}</h3>
                      {service.connected ? (
                        <div className="mt-1">
                          <p className="text-green-400 text-sm flex items-center">
                            <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                            Connected
                          </p>
                          {service.tracksImported && (
                            <p className="text-gray-400 text-xs mt-1">
                              {service.tracksImported} tracks imported
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm mt-1">Not connected</p>
                      )}
                    </div>
                  </div>
                  
                  {service.connected ? (
                    <button
                      onClick={() => handleDisconnect(service.id)}
                      className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(service.id)}
                      disabled={isConnecting === service.id}
                      className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition text-sm disabled:opacity-50"
                    >
                      {isConnecting === service.id ? (
                        <span className="flex items-center">
                          <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Connecting...
                        </span>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  )}
                </div>

                {service.connected && service.lastSync && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400 flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Last sync
                      </span>
                      <span className="text-white">
                        {new Date(service.lastSync).toLocaleString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <div className="md:col-span-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
              <h3 className="text-lg font-bold text-white mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                How it works
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Connect your music services to analyze your listening preferences. 
                We'll create a unique music portrait based on your favorite tracks, artists, and genres. 
                This data helps find perfect parties and suggest music that everyone will enjoy!
              </p>
              <p className="text-yellow-400 text-xs mt-3">
                ⚠️ Note: Currently showing demo data. Real service integration coming next!
              </p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                You are an {musicProfile.musicPersonality}
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Music Energy</span>
                    <span className="text-white font-bold">{musicProfile.energyLevel}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${musicProfile.energyLevel}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Taste Diversity</span>
                    <span className="text-white font-bold">{musicProfile.diversityScore}%</span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-1000"
                      style={{ width: `${musicProfile.diversityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Disc className="w-5 h-5 mr-2" />
                Your Favorite Genres
              </h3>
              <div className="space-y-3">
                {musicProfile.topGenres.map((genre, index) => (
                  <div key={genre.name}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-white font-medium">{index + 1}. {genre.name}</span>
                      <span className="text-gray-400 text-sm">{genre.percentage}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ 
                          width: `${genre.percentage}%`,
                          backgroundColor: genre.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Top Artists
                </h3>
                <div className="space-y-3">
                  {musicProfile.topArtists.slice(0, 5).map((artist, index) => (
                    <div key={artist.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full" />
                        <span className="text-white font-medium">{artist.name}</span>
                      </div>
                      <span className="text-gray-400 text-sm">{artist.plays} plays</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Favorite Tracks
                </h3>
                <div className="space-y-3">
                  {musicProfile.topTracks.map((track, index) => (
                    <div key={track.title} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 text-sm w-6">{index + 1}</span>
                        <div>
                          <p className="text-white font-medium">{track.title}</p>
                          <p className="text-gray-400 text-sm">{track.artist}</p>
                        </div>
                      </div>
                      <span className="text-gray-400 text-sm">{track.plays}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Clock className="w-8 h-8 text-purple-400" />
                <span className="text-3xl font-bold text-white">{musicProfile.listeningHours}</span>
              </div>
              <p className="text-gray-400">Hours of listening</p>
              <p className="text-gray-500 text-sm mt-1">Last year</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Music className="w-8 h-8 text-blue-400" />
                <span className="text-3xl font-bold text-white">{musicProfile.totalTracks}</span>
              </div>
              <p className="text-gray-400">Unique tracks</p>
              <p className="text-gray-500 text-sm mt-1">In your library</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="w-8 h-8 text-green-400" />
                <span className="text-3xl font-bold text-white">{connectedCount}</span>
              </div>
              <p className="text-gray-400">Connected services</p>
              <p className="text-gray-500 text-sm mt-1">Out of 4 available</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}