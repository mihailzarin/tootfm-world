'use client';

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  AlertCircle,
  Loader2,
  Shuffle,
  Repeat
} from 'lucide-react';
import { useSpotifyPlayer } from '@/src/hooks/useSpotifyPlayer';

interface PartyPlayerProps {
  tracks: Array<{
    id: string;
    spotifyId: string;
    name: string;
    artist: string;
    album?: string;
    albumArt?: string;
    duration: number;
    previewUrl?: string;
    matchScore: number;
    voteCount: number;
  }>;
  partyCode: string;
  isHost: boolean;
}

export default function PartyPlayer({ tracks, partyCode, isHost }: PartyPlayerProps) {
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [error, setError] = useState('');
  const [isShuffled, setIsShuffled] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isLoadingToken, setIsLoadingToken] = useState(true);

  // Получаем токен через API
  useEffect(() => {
    const fetchSpotifyToken = async () => {
      setIsLoadingToken(true);
      try {
        const response = await fetch('/api/spotify/token', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setSpotifyToken(data.accessToken);
          setError('');
          
          // Сохраняем в localStorage для кэша
          localStorage.setItem('spotify_access_token', data.accessToken);
          if (data.expiresAt) {
            localStorage.setItem('spotify_token_expiry', new Date(data.expiresAt).getTime().toString());
          }
          
          console.log('✅ Spotify token retrieved successfully');
        } else {
          const errorData = await response.json();
          console.error('Failed to get token:', errorData);
          
          // Пробуем из localStorage как fallback
          const cachedToken = localStorage.getItem('spotify_access_token');
          const cachedExpiry = localStorage.getItem('spotify_token_expiry');
          
          if (cachedToken && cachedExpiry && Date.now() < parseInt(cachedExpiry)) {
            console.log('Using cached token');
            setSpotifyToken(cachedToken);
            setError('');
          } else {
            setSpotifyToken(null);
            setError('Spotify Premium required. Please connect your account in Profile.');
          }
        }
      } catch (err) {
        console.error('Failed to fetch token:', err);
        setError('Failed to connect to Spotify');
      } finally {
        setIsLoadingToken(false);
      }
    };

    fetchSpotifyToken();
    // Обновляем токен каждые 30 минут
    const interval = setInterval(fetchSpotifyToken, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Используем хук правильно - передаем только токен
  const player = useSpotifyPlayer(spotifyToken);

  // Обрабатываем готовность плеера
  useEffect(() => {
    if (player.isReady && player.deviceId) {
      console.log('🎵 Player ready, device:', player.deviceId);
      setError('');
      
      // Если есть треки, начинаем воспроизведение
      if (tracks.length > 0 && tracks[0].spotifyId && tracks[0].spotifyId !== 'placeholder') {
        playTrack(0);
      }
    }
  }, [player.isReady, player.deviceId]);

  const playTrack = async (index: number) => {
    const track = tracks[index];
    if (!track?.spotifyId || track.spotifyId === 'placeholder' || !player.play) return;

    try {
      await player.play(`spotify:track:${track.spotifyId}`);
      setCurrentTrackIndex(index);
    } catch (err) {
      console.error('Failed to play track:', err);
      setError('Failed to play track. Make sure Spotify is active.');
    }
  };

  const handleNext = () => {
    if (currentTrackIndex < tracks.length - 1) {
      playTrack(currentTrackIndex + 1);
    } else if (isRepeating) {
      playTrack(0);
    }
  };

  const handlePrevious = () => {
    if (currentTrackIndex > 0) {
      playTrack(currentTrackIndex - 1);
    }
  };

  const handlePlayPause = () => {
    if (player.togglePlay) {
      player.togglePlay();
    } else if (player.isPlaying && player.pause) {
      player.pause();
    } else if (!player.isPlaying && player.play) {
      // Если не играет - продолжаем воспроизведение текущего трека
      const track = tracks[currentTrackIndex];
      if (track?.spotifyId && track.spotifyId !== 'placeholder') {
        player.play(`spotify:track:${track.spotifyId}`);
      }
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Показываем загрузку токена
  if (isLoadingToken) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Connecting to Spotify...</p>
        </div>
      </div>
    );
  }

  // Если нет токена
  if (!spotifyToken) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 text-yellow-400">
            <AlertCircle className="w-5 h-5" />
            <p className="font-medium">Spotify Premium Required</p>
          </div>
          <p className="text-gray-400 text-sm">
            Connect your Spotify Premium account in your Profile to play full tracks
          </p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="mt-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition"
          >
            Go to Profile
          </button>
        </div>
      </div>
    );
  }

  // Ждем инициализацию плеера
  if (!player.isReady) {
    return (
      <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p>Initializing Spotify Player...</p>
        </div>
        {!player.deviceId && (
          <p className="text-gray-400 text-sm mt-2">
            Make sure Spotify is open on this device
          </p>
        )}
      </div>
    );
  }

  const currentTrack = tracks[currentTrackIndex];

  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
      {/* Current Track Display */}
      {currentTrack && currentTrack.spotifyId !== 'placeholder' && (
        <div className="mb-6">
          <div className="flex items-center gap-4">
            {currentTrack.albumArt && (
              <img 
                src={currentTrack.albumArt} 
                alt={currentTrack.album}
                className="w-16 h-16 rounded-lg"
              />
            )}
            <div className="flex-1">
              <h4 className="text-white font-semibold">{currentTrack.name}</h4>
              <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
              {currentTrack.album && (
                <p className="text-gray-500 text-xs">{currentTrack.album}</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{formatTime(player.position)}</span>
              <span>{formatTime(player.duration || currentTrack.duration || 0)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all"
                style={{ 
                  width: `${player.duration ? (player.position / player.duration) * 100 : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Player Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setIsShuffled(!isShuffled)}
          className={`p-2 rounded-lg transition ${
            isShuffled ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Shuffle className="w-4 h-4" />
        </button>

        <button
          onClick={handlePrevious}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition"
          disabled={currentTrackIndex === 0}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 bg-green-500 hover:bg-green-400 rounded-full text-black transition"
        >
          {player.isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition"
          disabled={currentTrackIndex === tracks.length - 1 && !isRepeating}
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsRepeating(!isRepeating)}
          className={`p-2 rounded-lg transition ${
            isRepeating ? 'text-green-500' : 'text-gray-400 hover:text-white'
          }`}
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-3 mt-4">
        <Volume2 className="w-4 h-4 text-gray-400" />
        <input
          type="range"
          min="0"
          max="100"
          value={player.volume * 100}
          onChange={(e) => player.setVolume && player.setVolume(parseInt(e.target.value) / 100)}
          className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}