'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Music, Users, Globe, Lock, User, LogOut, Loader2, CheckCircle, XCircle, AlertCircle, Headphones, Radio, Disc3, BarChart3, TrendingUp, Calendar, Hash, Mic2, PlayCircle } from 'lucide-react';
import SpotifyPlayer from '@/components/SpotifyPlayer';
import WorldIDWidget from '@/components/WorldIDWidget';

interface MusicService {
  id: string;
  service: string;
  spotifyId?: string;
  lastfmUsername?: string;
  appleMusicId?: string;
  isActive: boolean;
  lastSynced?: string;
}

interface MusicProfile {
  id: string;
  unifiedTopTracks?: any[];
  unifiedTopArtists?: any[];
  unifiedTopGenres?: any[];
  lastAnalyzed?: string;
}

export default function ProfileClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('services');
  const [services, setServices] = useState<MusicService[]>([]);
  const [musicProfile, setMusicProfile] = useState<MusicProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [worldId, setWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка данных при монтировании и после redirect
  useEffect(() => {
    // Проверяем URL параметры после redirect от сервисов
    const params = new URLSearchParams(window.location.search);
    const spotifyConnected = params.get('spotify') === 'connected';
    const lastfmConnected = params.get('lastfm') === 'connected';
    const appleConnected = params.get('apple') === 'connected';
    const errorParam = params.get('error');
    const tabParam = params.get('tab');
    
    // Устанавливаем вкладку если указана
    if (tabParam) {
      setActiveTab(tabParam);
    }
    
    // Показываем ошибку если есть
    if (errorParam) {
      if (errorParam === 'spotify_error') {
        setError('Failed to connect Spotify. Please try again.');
      } else if (errorParam === 'apple_error') {
        setError('Failed to connect Apple Music. Please try again.');
      }
    }
    
    // Загружаем данные
    if (session?.user?.email) {
      fetchUserData();
    }
    
    // Очищаем URL параметры
    if (spotifyConnected || lastfmConnected || appleConnected || errorParam || tabParam) {
      window.history.replaceState({}, '', '/profile');
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Загружаем данные пользователя
      const userResponse = await fetch('/api/user/profile');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setWorldId(userData.worldId);
        setMusicProfile(userData.musicProfile);
      }
      
      // Загружаем подключенные сервисы
      await fetchServices();
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/music/services');
      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
    }
  };

  const handleSignOut = async () => {
    await signOut({ 
      callbackUrl: '/login',
      redirect: true 
    });
  };

  const connectSpotify = () => {
    window.location.href = '/api/spotify/auth';
  };

  const connectLastfm = () => {
    window.location.href = '/api/music/lastfm/connect';
  };

  const connectAppleMusic = async () => {
    try {
      const response = await fetch('/api/music/apple/token');
      const data = await response.json();
      
      if (data.token) {
        // Инициализируем MusicKit
        const script = document.createElement('script');
        script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
        script.async = true;
        document.body.appendChild(script);
        
        script.onload = async () => {
          // @ts-ignore
          const music = window.MusicKit.configure({
            developerToken: data.token,
            app: {
              name: 'tootFM',
              build: '1.0.0'
            }
          });
          
          try {
            // @ts-ignore
            const musicInstance = window.MusicKit.getInstance();
            await musicInstance.authorize();
            
            // Отправляем токен на сервер
            const saveResponse = await fetch('/api/music/apple/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                userToken: musicInstance.musicUserToken 
              })
            });
            
            if (saveResponse.ok) {
              await fetchServices();
              setError(null);
            } else {
              setError('Failed to save Apple Music connection');
            }
          } catch (err) {
            console.error('Apple Music auth error:', err);
            setError('Failed to connect Apple Music. Please try again.');
          }
        };
      }
    } catch (err) {
      console.error('Error connecting Apple Music:', err);
      setError('Failed to connect Apple Music. Please try again.');
    }
  };

  const disconnectService = async (service: string) => {
    try {
      const endpoint = service === 'SPOTIFY' 
        ? '/api/spotify/disconnect'
        : service === 'LASTFM'
        ? '/api/music/lastfm/disconnect'
        : '/api/music/apple/disconnect';
        
      const response = await fetch(endpoint, { method: 'POST' });
      if (response.ok) {
        await fetchServices();
      }
    } catch (err) {
      console.error(`Error disconnecting ${service}:`, err);
    }
  };

  const analyzeMusicTaste = async () => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/music/analyze', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMusicProfile(data.profile);
        setActiveTab('portrait');
      } else {
        setError('Failed to analyze music. Please make sure you have at least one music service connected.');
      }
    } catch (err) {
      console.error('Error analyzing music:', err);
      setError('Failed to analyze music taste. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isSpotifyConnected = services.some(s => s.service === 'SPOTIFY' && s.isActive);
  const isLastfmConnected = services.some(s => s.service === 'LASTFM' && s.isActive);
  const isAppleConnected = services.some(s => s.service === 'APPLE_MUSIC' && s.isActive);
  const hasAnyService = isSpotifyConnected || isLastfmConnected || isAppleConnected;

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <img
                src={session.user?.image || '/default-avatar.png'}
                alt="Profile"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h1 className="text-2xl font-bold">{session.user?.name || 'User'}</h1>
                <p className="text-gray-400">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-400">{error}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex space-x-1 border-b border-gray-800">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'services'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Music Services
          </button>
          <button
            onClick={() => setActiveTab('portrait')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'portrait'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('identity')}
            className={`px-4 py-2 font-medium transition ${
              activeTab === 'identity'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            World ID
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Spotify */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Music className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Spotify</h3>
                      {isSpotifyConnected ? (
                        <p className="text-green-400 text-sm">Connected</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Not connected</p>
                      )}
                    </div>
                  </div>
                  {isSpotifyConnected ? (
                    <button
                      onClick={() => disconnectService('SPOTIFY')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectSpotify}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition"
                    >
                      Connect Spotify
                    </button>
                  )}
                </div>
                {isSpotifyConnected && (
                  <div className="mt-4">
                    <SpotifyPlayer />
                  </div>
                )}
              </div>

              {/* Last.fm */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Last.fm</h3>
                      {isLastfmConnected ? (
                        <p className="text-green-400 text-sm">Connected</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Not connected</p>
                      )}
                    </div>
                  </div>
                  {isLastfmConnected ? (
                    <button
                      onClick={() => disconnectService('LASTFM')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectLastfm}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Connect Last.fm
                    </button>
                  )}
                </div>
              </div>

              {/* Apple Music */}
              <div className="bg-gray-900 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Headphones className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Apple Music</h3>
                      {isAppleConnected ? (
                        <p className="text-green-400 text-sm">Connected</p>
                      ) : (
                        <p className="text-gray-400 text-sm">Not connected</p>
                      )}
                    </div>
                  </div>
                  {isAppleConnected ? (
                    <button
                      onClick={() => disconnectService('APPLE_MUSIC')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={connectAppleMusic}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-lg transition"
                    >
                      Connect Apple Music
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'portrait' && (
            <div className="space-y-6">
              {!musicProfile ? (
                <div className="bg-gray-900 rounded-lg p-8 text-center">
                  <Disc3 className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Music Portrait Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Connect at least one music service and analyze your music taste to create your portrait
                  </p>
                  <button
                    onClick={analyzeMusicTaste}
                    disabled={!hasAnyService || isAnalyzing}
                    className={`px-6 py-3 rounded-lg font-medium transition ${
                      hasAnyService && !isAnalyzing
                        ? 'bg-white text-black hover:bg-gray-200'
                        : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analyzing...</span>
                      </span>
                    ) : (
                      'Analyze Music'
                    )}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-900 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Top Tracks</span>
                    </h4>
                    <div className="space-y-2">
                      {musicProfile.unifiedTopTracks?.slice(0, 5).map((track, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-gray-400">{i + 1}.</span> {track.name}
                        </div>
                      )) || <p className="text-gray-400">No data</p>}
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Mic2 className="w-5 h-5" />
                      <span>Top Artists</span>
                    </h4>
                    <div className="space-y-2">
                      {musicProfile.unifiedTopArtists?.slice(0, 5).map((artist, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-gray-400">{i + 1}.</span> {artist.name}
                        </div>
                      )) || <p className="text-gray-400">No data</p>}
                    </div>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                      <Hash className="w-5 h-5" />
                      <span>Top Genres</span>
                    </h4>
                    <div className="space-y-2">
                      {musicProfile.unifiedTopGenres?.slice(0, 5).map((genre, i) => (
                        <div key={i} className="text-sm">
                          <span className="text-gray-400">{i + 1}.</span> {genre}
                        </div>
                      )) || <p className="text-gray-400">No data</p>}
                    </div>
                  </div>
                </div>
              )}

              {musicProfile && (
                <div className="text-center mt-6">
                  <button
                    onClick={analyzeMusicTaste}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Re-analyzing...</span>
                      </span>
                    ) : (
                      'Update Portrait'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">World ID Verification</h3>
              {worldId ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    <span>Verified with World ID</span>
                  </div>
                  <p className="text-gray-400 text-sm">ID: {worldId}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400">
                    Verify your identity with World ID to participate in voting
                  </p>
                  <WorldIDWidget 
                    onSuccess={(id: string) => {
                      setWorldId(id);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}