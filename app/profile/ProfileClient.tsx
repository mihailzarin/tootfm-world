"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import AppleMusicConnect from "@/components/music-services/AppleMusicConnect";

export default function ProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  
  // States for services
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyUser, setSpotifyUser] = useState<Record<string, any> | null>(null);
  const [lastfmUser, setLastfmUser] = useState<string | null>(null);
  const [appleMusicConnected, setAppleMusicConnected] = useState(false);
  
  // UI states
  const [activeTab, setActiveTab] = useState('services');
  const [musicProfile, setMusicProfile] = useState<Record<string, any> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Проверка статуса Spotify через API
  const checkSpotifyStatus = async () => {
    try {
      const response = await fetch('/api/spotify/status', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.connected && data.user) {
        setSpotifyConnected(true);
        setSpotifyUser(data.user);
        localStorage.setItem('spotify_user', JSON.stringify(data.user));
      } else {
        setSpotifyConnected(false);
        setSpotifyUser(null);
        localStorage.removeItem('spotify_user');
      }
    } catch (error) {
      console.error('Error checking Spotify status:', error);
      setSpotifyConnected(false);
    }
  };

  // Проверка Last.fm
  const checkLastfmStatus = () => {
    const username = localStorage.getItem('lastfm_username');
    if (username) {
      setLastfmUser(username);
    }
  };

  // Проверка Apple Music
  const checkAppleMusicStatus = () => {
    const token = localStorage.getItem('music.73tyd562w2.media-user-token');
    setAppleMusicConnected(!!token);
  };

  // Инициализация при загрузке
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      localStorage.setItem('user_data', JSON.stringify({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        id: session.user.id
      }));
      
      checkSpotifyStatus();
      checkLastfmStatus();
      checkAppleMusicStatus();
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  // Обработка OAuth callbacks
  useEffect(() => {
    if (searchParams.get('spotify') === 'connected') {
      console.log('Spotify connected successfully!');
      checkSpotifyStatus();
      router.replace('/profile');
    }
    
    const error = searchParams.get('error');
    if (error) {
      console.error('OAuth error:', error);
      setProfileError(getErrorMessage(error));
      router.replace('/profile');
    }
  }, [searchParams, router]);

  // Функция подключения Spotify
  const connectSpotify = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI;
    const scopes = [
      'user-read-private',
      'user-read-email',
      'user-top-read',
      'user-library-read',
      'playlist-read-private',
      'playlist-modify-public',
      'playlist-modify-private',
      'streaming',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' ');

    const authUrl = `https://accounts.spotify.com/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `show_dialog=false`;

    window.location.href = authUrl;
  };

  // Функция отключения Spotify
  const disconnectSpotify = async () => {
    try {
      const response = await fetch('/api/spotify/disconnect', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        setSpotifyConnected(false);
        setSpotifyUser(null);
        localStorage.removeItem('spotify_user');
      }
    } catch (error) {
      console.error('Error disconnecting Spotify:', error);
    }
  };

  // Функция подключения Last.fm
  const connectLastfm = () => {
    const apiKey = process.env.NEXT_PUBLIC_LASTFM_API_KEY;
    const callbackUrl = `${window.location.origin}/api/music/lastfm/callback`;
    const authUrl = `https://www.last.fm/api/auth/?api_key=${apiKey}&cb=${encodeURIComponent(callbackUrl)}`;
    window.location.href = authUrl;
  };

  // Функция отключения Last.fm
  const disconnectLastfm = () => {
    localStorage.removeItem('lastfm_username');
    localStorage.removeItem('lastfm_session_key');
    setLastfmUser(null);
  };

  // Функция генерации музыкального портрета
  const generateMusicProfile = async () => {
    setProfileLoading(true);
    setProfileError(null);
    
    try {
      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to analyze music profile');
      }

      const data = await response.json();
      
      if (data.success && data.profile) {
        setMusicProfile(data.profile);
        setActiveTab('portrait');
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error generating music profile:', error);
      setProfileError(error.message || 'Failed to generate music portrait');
    } finally {
      setProfileLoading(false);
    }
  };

  // Вспомогательная функция для сообщений об ошибках
  const getErrorMessage = (error: string): string => {
    switch(error) {
      case 'spotify_denied':
        return 'Spotify authorization was cancelled';
      case 'no_code':
        return 'No authorization code received from Spotify';
      case 'token_failed':
        return 'Failed to get Spotify access token';
      case 'profile_failed':
        return 'Failed to get Spotify profile';
      case 'spotify_error':
        return 'An error occurred connecting to Spotify';
      default:
        return 'An unexpected error occurred';
    }
  };

  // Если загружается сессия
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован
  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          {session?.user?.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{session?.user?.name || 'User'}</h1>
            <p className="text-gray-600">{session?.user?.email}</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {profileError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p>{profileError}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Music Services
          </button>
          <button
            onClick={() => setActiveTab('portrait')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'portrait'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Music Portrait
          </button>
          <button
            onClick={() => setActiveTab('parties')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'parties'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            My Parties
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'services' && (
        <div className="grid md:grid-cols-3 gap-6">
          {/* Spotify Card */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Spotify</h3>
              {spotifyConnected && (
                <span className="text-green-600 text-sm">Connected</span>
              )}
            </div>
            
            {spotifyConnected && spotifyUser ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  {spotifyUser.display_name || spotifyUser.email}
                </p>
                <button
                  onClick={disconnectSpotify}
                  className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectSpotify}
                className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                Connect Spotify
              </button>
            )}
          </div>

          {/* Last.fm Card */}
          <div className="bg-red-50 rounded-lg p-6 border border-red-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Last.fm</h3>
              {lastfmUser && (
                <span className="text-red-600 text-sm">Connected</span>
              )}
            </div>
            
            {lastfmUser ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">@{lastfmUser}</p>
                <button
                  onClick={disconnectLastfm}
                  className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectLastfm}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Connect Last.fm
              </button>
            )}
          </div>

          {/* Apple Music Card */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Apple Music</h3>
              {appleMusicConnected && (
                <span className="text-gray-600 text-sm">Connected</span>
              )}
            </div>
            
            {appleMusicConnected ? (
              <div>
                <p className="text-sm text-gray-600 mb-3">Connected</p>
                <button
                  onClick={() => {
                    localStorage.removeItem('music.73tyd562w2.media-user-token');
                    setAppleMusicConnected(false);
                  }}
                  className="w-full bg-white text-gray-700 px-4 py-2 rounded-lg border hover:bg-gray-50"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <AppleMusicConnect />
            )}
          </div>
        </div>
      )}

      {activeTab === 'portrait' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          {!musicProfile ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Generate Your Music Portrait</h2>
              <p className="text-gray-600 mb-6">
                Connect at least one music service to generate your personalized music portrait
              </p>
              <button
                onClick={generateMusicProfile}
                disabled={profileLoading || (!spotifyConnected && !lastfmUser && !appleMusicConnected)}
                className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
              >
                {profileLoading ? 'Analyzing...' : 'Generate Portrait'}
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold mb-4">{musicProfile.personality}</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(musicProfile.energy || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Energy</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(musicProfile.diversity || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Diversity</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {Math.round(musicProfile.mainstream || 0)}%
                  </div>
                  <div className="text-sm text-gray-600">Mainstream</div>
                </div>
              </div>
              
              {musicProfile.genres && musicProfile.genres.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Top Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {musicProfile.genres.map((genre: string, index: number) => (
                      <span 
                        key={index}
                        className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={generateMusicProfile}
                className="mt-6 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                Refresh Portrait
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'parties' && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">My Parties</h2>
          <p className="text-gray-600">Party feature coming soon...</p>
        </div>
      )}
    </main>
  );
}