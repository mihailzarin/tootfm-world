// components/party/PartyPlayer.tsx
// Полноценный музыкальный плеер для party

'use client';

import { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  Music,
  AlertCircle,
  Loader2,
  Shuffle,
  Repeat
} from 'lucide-react';
import { useSpotifyPlayer } from '@/hooks/useSpotifyPlayer';

interface PartyPlayerProps {
  tracks: Array<{
    id: string;
    spotifyId: string;
    name: string;
    artist: string;
    album?: string;
    albumArt?: string;
    duration: number;
    voteCount: number;
  }>;
  partyCode: string;
  isHost?: boolean;
}

export default function PartyPlayer({ tracks, partyCode, isHost = false }: PartyPlayerProps) {
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showVolume, setShowVolume] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('all');

  // Получаем токен из cookies
  useEffect(() => {
    const checkToken = async () => {
      try {
        // Проверяем статус токена
        const response = await fetch('/api/spotify/refresh', {
          method: 'GET'
        });
        
        const data = await response.json();
        
        if (!data.valid) {
          setError('Please connect Spotify to play music');
          return;
        }

        // Если токен скоро истекает, обновляем
        if (data.minutesLeft < 5 && data.canRefresh) {
          console.log('🔄 Token expiring soon, refreshing...');
          const refreshResponse = await fetch('/api/spotify/refresh', {
            method: 'POST'
          });
          
          if (!refreshResponse.ok) {
            setError('Failed to refresh Spotify token');
            return;
          }
        }

        // Получаем токен для SDK
        const tokenResponse = await fetch('/api/spotify/token');
        const tokenData = await tokenResponse.json();
        
        if (tokenData.token) {
          setSpotifyToken(tokenData.token);
        } else {
          setError('No Spotify token available');
        }
      } catch (err) {
        console.error('❌ Token check failed:', err);
        setError('Failed to initialize player');
      }
    };

    checkToken();
    
    // Проверяем токен каждые 30 минут
    const interval = setInterval(checkToken, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Инициализируем плеер
  const player = useSpotifyPlayer({
    token: spotifyToken,
    onError: (err) => {
      setError(err);
      console.error('Player error:', err);
    },
    onReady: (deviceId) => {
      console.log('🎵 Player ready, device:', deviceId);
      setError('');
      
      // Автоматически переносим воспроизведение на веб-плеер
      if (isHost) {
        player.transferPlayback(false);
      }
    }
  });

  // Сортируем треки по голосам
  const sortedTracks = [...tracks].sort((a, b) => b.voteCount - a.voteCount);

  // Форматируем URIs для Spotify
  const trackUris = sortedTracks.map(track => `spotify:track:${track.spotifyId}`);

  // Играть конкретный трек
  const playTrack = async (index: number) => {
    if (!player.is_ready) {
      setError('Player not ready. Please wait...');
      return;
    }

    setCurrentTrackIndex(index);
    const uri = trackUris[index];
    
    if (uri) {
      await player.play(uri);
    }
  };

  // Играть всю очередь
  const playQueue = async () => {
    if (!player.is_ready || trackUris.length === 0) {
      setError('No tracks in queue or player not ready');
      return;
    }

    const urisToPlay = isShuffled ? shuffleArray([...trackUris]) : trackUris;
    await player.playTracks(urisToPlay, currentTrackIndex);
  };

  // Следующий трек
  const handleNext = async () => {
    if (repeatMode === 'one') {
      await player.seek(0);
      return;
    }

    const nextIndex = (currentTrackIndex + 1) % sortedTracks.length;
    setCurrentTrackIndex(nextIndex);
    
    if (nextIndex === 0 && repeatMode === 'off') {
      await player.pause();
    } else {
      await player.next();
    }
  };

  // Предыдущий трек
  const handlePrevious = async () => {
    if (player.position > 3000) {
      // Если прошло больше 3 секунд, начинаем трек сначала
      await player.seek(0);
    } else {
      const prevIndex = currentTrackIndex === 0 
        ? sortedTracks.length - 1 
        : currentTrackIndex - 1;
      setCurrentTrackIndex(prevIndex);
      await player.previous();
    }
  };

  // Shuffle helper
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Текущий трек
  const currentTrack = player.current_track || sortedTracks[currentTrackIndex];

  // Progress bar percentage
  const progress = player.duration > 0 
    ? (player.position / player.duration) * 100 
    : 0;

  // Если нет токена или Spotify не подключен
  if (error === 'Please connect Spotify to play music') {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-6 text-white">
        <div className="flex items-center justify-center flex-col gap-4 py-8">
          <Music className="w-16 h-16 text-gray-400" />
          <p className="text-gray-400">Connect Spotify to play music</p>
          <a 
            href="/api/spotify/auth" 
            className="px-6 py-2 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition"
          >
            Connect Spotify
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-purple-800 to-black rounded-2xl p-6 text-white">
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Player status */}
      {!player.is_ready && spotifyToken && (
        <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg flex items-center gap-2">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          <span className="text-sm">Initializing player...</span>
        </div>
      )}

      {/* Current track info */}
      <div className="mb-6">
        {currentTrack ? (
          <div className="flex items-center gap-4">
            {/* Album art */}
            <div className="w-20 h-20 bg-purple-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
              {currentTrack.albumArt || (currentTrack as any).album?.images?.[0]?.url ? (
                <img 
                  src={currentTrack.albumArt || (currentTrack as any).album?.images?.[0]?.url}
                  alt={currentTrack.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Music className="w-10 h-10 text-purple-300" />
              )}
            </div>
            
            {/* Track details */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg truncate">
                {currentTrack.name}
              </h3>
              <p className="text-purple-200 text-sm truncate">
                {currentTrack.artist || (currentTrack as any).artists?.[0]?.name}
              </p>
              {currentTrack.album && (
                <p className="text-purple-300 text-xs truncate">
                  {currentTrack.album || (currentTrack as any).album?.name}
                </p>
              )}
            </div>

            {/* Vote count */}
            {(currentTrack as any).voteCount !== undefined && (
              <div className="text-center">
                <div className="text-2xl font-bold">{(currentTrack as any).voteCount}</div>
                <div className="text-xs text-purple-300">votes</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Music className="w-12 h-12 mx-auto mb-2" />
            <p>No track selected</p>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-xs text-purple-300 mb-1">
          <span>{player.formatTime(player.position)}</span>
          <div className="flex-1 bg-purple-700/30 rounded-full h-1 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{player.formatTime(player.duration)}</span>
        </div>
      </div>

      {/* Main controls */}
      <div className="flex items-center justify-center gap-4 mb-4">
        {/* Shuffle */}
        <button
          onClick={() => setIsShuffled(!isShuffled)}
          className={`p-2 rounded-full transition ${
            isShuffled 
              ? 'text-purple-300 bg-purple-700/50' 
              : 'text-gray-400 hover:text-white'
          }`}
          title="Shuffle"
        >
          <Shuffle className="w-5 h-5" />
        </button>

        {/* Previous */}
        <button
          onClick={handlePrevious}
          disabled={!player.is_ready}
          className="p-3 rounded-full bg-purple-700/50 hover:bg-purple-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-6 h-6" />
        </button>

        {/* Play/Pause */}
        <button
          onClick={() => player.is_playing ? player.pause() : playQueue()}
          disabled={!player.is_ready || sortedTracks.length === 0}
          className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {player.is_playing ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={handleNext}
          disabled={!player.is_ready}
          className="p-3 rounded-full bg-purple-700/50 hover:bg-purple-600/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-6 h-6" />
        </button>

        {/* Repeat */}
        <button
          onClick={() => {
            const modes: Array<'off' | 'all' | 'one'> = ['off', 'all', 'one'];
            const currentIndex = modes.indexOf(repeatMode);
            setRepeatMode(modes[(currentIndex + 1) % modes.length]);
          }}
          className={`p-2 rounded-full transition relative ${
            repeatMode !== 'off'
              ? 'text-purple-300 bg-purple-700/50' 
              : 'text-gray-400 hover:text-white'
          }`}
          title={`Repeat: ${repeatMode}`}
        >
          <Repeat className="w-5 h-5" />
          {repeatMode === 'one' && (
            <span className="absolute -top-1 -right-1 text-xs bg-purple-500 rounded-full w-4 h-4 flex items-center justify-center">
              1
            </span>
          )}
        </button>
      </div>

      {/* Volume control */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setShowVolume(!showVolume)}
          className="p-2 rounded-full hover:bg-purple-700/50 transition"
        >
          <Volume2 className="w-5 h-5" />
        </button>
        
        {showVolume && (
          <input
            type="range"
            min="0"
            max="100"
            value={player.volume * 100}
            onChange={(e) => player.setVolume(parseInt(e.target.value) / 100)}
            className="w-32 accent-purple-500"
          />
        )}
      </div>

      {/* Queue preview */}
      {sortedTracks.length > 0 && (
        <div className="mt-6 pt-6 border-t border-purple-700/50">
          <h4 className="text-sm font-bold text-purple-300 mb-2">
            Up Next ({sortedTracks.length} tracks)
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {sortedTracks.slice(0, 5).map((track, index) => (
              <button
                key={track.id}
                onClick={() => playTrack(index)}
                className={`w-full text-left p-2 rounded hover:bg-purple-700/30 transition flex items-center gap-2 ${
                  index === currentTrackIndex ? 'bg-purple-700/50' : ''
                }`}
              >
                <span className="text-xs text-purple-400 w-6">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{track.name}</p>
                  <p className="text-xs text-purple-300 truncate">{track.artist}</p>
                </div>
                <span className="text-xs text-purple-400">{track.voteCount} votes</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Device info */}
      {player.is_ready && (
        <div className="mt-4 text-center text-xs text-purple-400">
          Playing on: tootFM Web Player
        </div>
      )}
    </div>
  );
}