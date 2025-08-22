'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// Глобальные типы для Spotify SDK
declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: typeof Spotify;
  }

  namespace Spotify {
    interface Track {
      id: string;
      uri: string;
      name: string;
      duration_ms: number;
      artists: Array<{
        name: string;
        uri: string;
      }>;
      album: {
        name: string;
        uri: string;
        images: Array<{
          url: string;
          height: number;
          width: number;
        }>;
      };
    }

    interface Player {
      connect(): Promise<boolean>;
      disconnect(): void;
      addListener(event: string, callback: (state: any) => void): void;
      removeListener(event: string): void;
      getCurrentState(): Promise<any>;
      pause(): Promise<void>;
      resume(): Promise<void>;
      togglePlay(): Promise<void>;
      seek(position_ms: number): Promise<void>;
      previousTrack(): Promise<void>;
      nextTrack(): Promise<void>;
      setVolume(volume: number): Promise<void>;
      getVolume(): Promise<number>;
    }

    interface PlayerConstructor {
      new (options: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }): Player;
    }

    const Player: PlayerConstructor;
  }
}

interface SpotifyPlayerState {
  isReady: boolean;
  isPlaying: boolean;
  player: Spotify.Player | null;
  deviceId: string | null;
  current_track: Spotify.Track | null;
  position: number;
  duration: number;
  volume: number;
}

export function useSpotifyPlayer(accessToken: string | null) {
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    isReady: false,
    isPlaying: false,
    player: null,
    deviceId: null,
    current_track: null,
    position: 0,
    duration: 0,
    volume: 0.5
  });

  const playerRef = useRef<Spotify.Player | null>(null);

  useEffect(() => {
    if (!accessToken) {
      console.log('No access token, skipping Spotify Player init');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      console.log('🎵 Initializing Spotify Player...');
      const spotifyPlayer = new window.Spotify.Player({
        name: 'tootFM Web Player',
        getOAuthToken: (cb: (token: string) => void) => {
          cb(accessToken);
        },
        volume: 0.5
      });

      spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
        console.log('✅ Spotify Player ready with Device ID', device_id);
        setPlayerState(prev => ({
          ...prev,
          isReady: true,
          deviceId: device_id,
          player: spotifyPlayer
        }));
      });

      spotifyPlayer.addListener('player_state_changed', (state: any) => {
        if (!state) return;

        const current_track = state.track_window.current_track;
        setPlayerState(prev => ({
          ...prev,
          current_track,
          position: state.position,
          duration: state.duration,
          isPlaying: !state.paused
        }));
      });

      spotifyPlayer.connect();
      playerRef.current = spotifyPlayer;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      const script = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (script) {
        document.body.removeChild(script);
      }
    };
  }, [accessToken]);

  const play = useCallback(async (spotify_uri?: string) => {
    if (!playerState.deviceId || !accessToken) return;

    const endpoint = spotify_uri
      ? `https://api.spotify.com/v1/me/player/play?device_id=${playerState.deviceId}`
      : `https://api.spotify.com/v1/me/player/play`;

    await fetch(endpoint, {
      method: 'PUT',
      body: spotify_uri ? JSON.stringify({ uris: [spotify_uri] }) : undefined,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
  }, [playerState.deviceId, accessToken]);

  const pause = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.pause();
    }
  }, []);

  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    }
  }, []);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    }
  }, []);

  const previousTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.previousTrack();
    }
  }, []);

  const seek = useCallback(async (position_ms: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(position_ms);
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(volume);
      setPlayerState(prev => ({ ...prev, volume }));
    }
  }, []);

  return {
    ...playerState,
    play,
    pause,
    togglePlay,
    nextTrack,
    previousTrack,
    seek,
    setVolume
  };
}
