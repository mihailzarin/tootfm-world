// =====================================================
// UNIFIED MUSIC PROFILE - СИСТЕМА ТИПОВ
// Единый язык для всех музыкальных сервисов
// =====================================================

// Базовые типы
export type MusicService = 'spotify' | 'apple' | 'lastfm' | 'youtube' | 'soundcloud';
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'error';
export type TimeRange = 'short_term' | 'medium_term' | 'long_term';

// Трек
export interface Track {
  id: string;
  service: MusicService;
  originalId: string;
  title: string;
  artist: string;
  artists?: string[];
  album?: string;
  albumId?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  previewUrl?: string;
  externalUrl: string;
  duration?: number;
  explicit?: boolean;
  releaseDate?: string;
  playCount?: number;
  lastPlayed?: Date;
  addedAt?: Date;
  weight?: number;
}

// Артист
export interface Artist {
  id: string;
  service: MusicService;
  originalId: string;
  name: string;
  imageUrl?: string;
  genres?: string[];
  popularity?: number;
  externalUrl: string;
  playCount?: number;
  trackCount?: number;
  weight?: number;
}

// История прослушивания
export interface PlayHistory {
  track: Track;
  playedAt: Date;
  context?: string;
  deviceType?: string;
}

// Профиль пользователя в сервисе
export interface ServiceUserProfile {
  id: string;
  service: MusicService;
  displayName?: string;
  email?: string;
  imageUrl?: string;
  country?: string;
  product?: string;
  followers?: number;
  externalUrl?: string;
}

// Интерфейс адаптера для музыкальных сервисов
export interface MusicServiceAdapter {
  name: MusicService;
  isConnected: boolean;
  
  connect(redirectUri: string): Promise<string>;
  handleCallback(code: string): Promise<ServiceUserProfile>;
  disconnect(): Promise<void>;
  
  getTopTracks(limit?: number, timeRange?: TimeRange): Promise<Track[]>;
  getTopArtists(limit?: number, timeRange?: TimeRange): Promise<Artist[]>;
  getRecentlyPlayed(limit?: number): Promise<PlayHistory[]>;
  getUserProfile(): Promise<ServiceUserProfile>;
  
  searchTracks?(query: string): Promise<Track[]>;
}
