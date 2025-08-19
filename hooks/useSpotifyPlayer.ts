// hooks/useSpotifyPlayer.ts
// Hook для управления Spotify Web Playback SDK

import { useEffect, useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }
}

interface SpotifyPlayer {
  device_id: string;
  player: Spotify.Player | null;
  is_ready: boolean;
  is_active: boolean;
  current_track: Spotify.Track | null;
  position: number;
  duration: number;
  is_playing: boolean;
  volume: number;
}

interface UseSpotifyPlayerProps {
  token: string | null;
  onError?: (error: string) => void;
  onReady?: (device_id: string) => void;
}

export function useSpotifyPlayer({ token, onError, onReady }: UseSpotifyPlayerProps) {
  const [player, setPlayer] = useState<SpotifyPlayer>({
    device_id: '',
    player: null,
    is_ready: false,
    is_active: false,
    current_track: null,
    position: 0,
    duration: 0,
    is_playing: false,
    volume: 0.5
  });

  const playerRef = useRef<Spotify.Player | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Загрузка SDK
  useEffect(() => {
    if (!token) return;

    // Проверяем, не загружен ли уже SDK
    if (window.Spotify) {
      console.log('✅ Spotify SDK already loaded');
      initializePlayer();
      return;
    }

    // Загружаем SDK
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    // Callback когда SDK загружен
    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('✅ Spotify Web Playback SDK Ready');
      initializePlayer();
    };

    return () => {
      // Cleanup
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [token]);

  // Инициализация плеера
  const initializePlayer = useCallback(() => {
    if (!token || !window.Spotify) return;

    console.log('🎵 Initializing Spotify Player...');

    const spotifyPlayer = new window.Spotify.Player({
      name: 'tootFM Web Player',
      getOAuthToken: (cb: (token: string) => void) => {
        console.log('📝 Providing token to player');
        cb(token);
      },
      volume: 0.5
    });

    // Error handling
    spotifyPlayer.addListener('initialization_error', ({ message }) => {
      console.error('❌ Failed to initialize:', message);
      onError?.('Failed to initialize player');
    });

    spotifyPlayer.addListener('authentication_error', ({ message }) => {
      console.error('❌ Authentication failed:', message);
      onError?.('Authentication failed - please reconnect Spotify');
    });

    spotifyPlayer.addListener('account_error', ({ message }) => {
      console.error('❌ Account error:', message);
      onError?.('Spotify Premium is required for playback');
    });

    spotifyPlayer.addListener('playback_error', ({ message }) => {
      console.error('❌ Playback error:', message);
      onError?.('Playback error occurred');
    });

    // Ready
    spotifyPlayer.addListener('ready', ({ device_id }) => {
      console.log('✅ Player ready with Device ID:', device_id);
      setPlayer(prev => ({
        ...prev,
        device_id,
        player: spotifyPlayer,
        is_ready: true
      }));
      onReady?.(device_id);
    });

    // Not ready
    spotifyPlayer.addListener('not_ready', ({ device_id }) => {
      console.log('⚠️ Device has gone offline:', device_id);
      setPlayer(prev => ({
        ...prev,
        is_ready: false,
        is_active: false
      }));
    });

    // Player state changed
    spotifyPlayer.addListener('player_state_changed', (state) => {
      if (!state) return;

      console.log('🎵 Player state changed:', {
        track: state.track_window.current_track?.name,
        playing: !state.paused,
        position: state.position
      });

      setPlayer(prev => ({
        ...prev,
        current_track: state.track_window.current_track,
        position: state.position,
        duration: state.duration,
        is_playing: !state.paused,
        is_active: true
      }));
    });

    // Connect to the player
    spotifyPlayer.connect().then((success: boolean) => {
      if (success) {
        console.log('✅ Successfully connected to Spotify!');
      } else {
        console.error('❌ Failed to connect to Spotify');
        onError?.('Failed to connect to player');
      }
    });

    playerRef.current = spotifyPlayer;
    setPlayer(prev => ({ ...prev, player: spotifyPlayer }));

    // Update position every second
    intervalRef.current = setInterval(() => {
      spotifyPlayer.getCurrentState().then((state) => {
        if (state && !state.paused) {
          setPlayer(prev => ({
            ...prev,
            position: state.position
          }));
        }
      });
    }, 1000);
  }, [token, onError, onReady]);

  // Control functions
  const play = useCallback(async (spotify_uri?: string) => {
    if (!playerRef.current || !player.device_id || !token) {
      console.error('❌ Player not ready');
      return;
    }

    try {
      if (spotify_uri) {
        // Play specific track
        console.log('▶️ Playing track:', spotify_uri);
        
        const response = await fetch('https://api.spotify.com/v1/me/player/play?device_id=' + player.device_id, {
          method: 'PUT',
          body: JSON.stringify({
            uris: [spotify_uri]
          }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to play track');
        }
      } else {
        // Resume playback
        await playerRef.current.resume();
      }
    } catch (error) {
      console.error('❌ Play error:', error);
      onError?.('Failed to play track');
    }
  }, [player.device_id, token, onError]);

  const pause = useCallback(async () => {
    if (!playerRef.current) return;
    await playerRef.current.pause();
  }, []);

  const next = useCallback(async () => {
    if (!playerRef.current) return;
    await playerRef.current.nextTrack();
  }, []);

  const previous = useCallback(async () => {
    if (!playerRef.current) return;
    await playerRef.current.previousTrack();
  }, []);

  const seek = useCallback(async (position_ms: number) => {
    if (!playerRef.current) return;
    await playerRef.current.seek(position_ms);
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    if (!playerRef.current) return;
    await playerRef.current.setVolume(volume);
    setPlayer(prev => ({ ...prev, volume }));
  }, []);

  const playTracks = useCallback(async (track_uris: string[], offset = 0) => {
    if (!player.device_id || !token) {
      console.error('❌ Player not ready for queue');
      return;
    }

    try {
      console.log('🎵 Playing tracks queue:', track_uris.length, 'tracks');
      
      const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${player.device_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          uris: track_uris,
          offset: { position: offset }
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Failed to play queue:', error);
        throw new Error('Failed to play queue');
      }

      console.log('✅ Queue started playing');
    } catch (error) {
      console.error('❌ Queue play error:', error);
      onError?.('Failed to play queue');
    }
  }, [player.device_id, token, onError]);

  // Transfer playback to this device
  const transferPlayback = useCallback(async (play = false) => {
    if (!player.device_id || !token) return;

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        body: JSON.stringify({
          device_ids: [player.device_id],
          play
        }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        console.log('✅ Playback transferred to web player');
      }
    } catch (error) {
      console.error('❌ Transfer error:', error);
    }
  }, [player.device_id, token]);

  return {
    // State
    ...player,
    
    // Controls
    play,
    pause,
    next,
    previous,
    seek,
    setVolume,
    playTracks,
    transferPlayback,
    
    // Utils
    formatTime: (ms: number) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
  };
}