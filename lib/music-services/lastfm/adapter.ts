// =====================================================
// LAST.FM АДАПТЕР
// Интеграция с Last.fm API
// =====================================================

import { MusicServiceAdapter, Track, Artist, ServiceUserProfile, TimeRange } from '../types';
import { LastFmApi } from './api';
import { LastFmTransformer } from './transformer';

export class LastFmAdapter implements MusicServiceAdapter {
  name = 'lastfm' as const;
  isConnected = false;
  
  private api: LastFmApi;
  private transformer: LastFmTransformer;
  private username?: string;
  private sessionKey?: string;

  constructor(
    private apiKey: string,
    private apiSecret: string,
    sessionKey?: string,
    username?: string
  ) {
    this.api = new LastFmApi(apiKey, apiSecret);
    this.transformer = new LastFmTransformer();
    this.sessionKey = sessionKey;
    this.username = username;
    this.isConnected = !!sessionKey && !!username;
  }

  async connect(redirectUri: string): Promise<string> {
    const token = await this.api.getAuthToken();
    const authUrl = `https://www.last.fm/api/auth/?api_key=${this.apiKey}&token=${token}&cb=${encodeURIComponent(redirectUri)}`;
    return authUrl;
  }

  async handleCallback(token: string): Promise<ServiceUserProfile> {
    const session = await this.api.getSession(token);
    this.sessionKey = session.key;
    this.username = session.name;
    this.isConnected = true;

    const userInfo = await this.api.getUserInfo(this.username);
    return {
      id: userInfo.name,
      service: 'lastfm',
      displayName: userInfo.realname || userInfo.name,
      imageUrl: userInfo.image?.[3]?.['#text'],
      country: userInfo.country,
      externalUrl: userInfo.url,
      followers: parseInt(userInfo.playcount || '0')
    };
  }

  async disconnect(): Promise<void> {
    this.sessionKey = undefined;
    this.username = undefined;
    this.isConnected = false;
  }

  async getTopTracks(limit = 50, timeRange: TimeRange = 'medium_term'): Promise<Track[]> {
    if (!this.username) throw new Error('Not connected to Last.fm');
    const period = this.convertTimeRange(timeRange);
    const response = await this.api.getUserTopTracks(this.username, period, limit);
    return this.transformer.transformTracks(response.toptracks.track);
  }

  async getTopArtists(limit = 50, timeRange: TimeRange = 'medium_term'): Promise<Artist[]> {
    if (!this.username) throw new Error('Not connected to Last.fm');
    const period = this.convertTimeRange(timeRange);
    const response = await this.api.getUserTopArtists(this.username, period, limit);
    return this.transformer.transformArtists(response.topartists.artist);
  }

  async getRecentlyPlayed(limit = 50): Promise<any[]> {
    if (!this.username) throw new Error('Not connected to Last.fm');
    const response = await this.api.getUserRecentTracks(this.username, limit);
    return this.transformer.transformRecentTracks(response.recenttracks.track);
  }

  async getUserProfile(): Promise<ServiceUserProfile> {
    if (!this.username) throw new Error('Not connected to Last.fm');
    const userInfo = await this.api.getUserInfo(this.username);
    return {
      id: userInfo.name,
      service: 'lastfm',
      displayName: userInfo.realname || userInfo.name,
      imageUrl: userInfo.image?.[3]?.['#text'],
      country: userInfo.country,
      externalUrl: userInfo.url,
      followers: parseInt(userInfo.playcount || '0')
    };
  }

  private convertTimeRange(timeRange: TimeRange): string {
    switch (timeRange) {
      case 'short_term': return '1month';
      case 'medium_term': return '6month';
      case 'long_term': return '12month';
      default: return '6month';
    }
  }

  getSessionKey(): string | undefined {
    return this.sessionKey;
  }

  getUsername(): string | undefined {
    return this.username;
  }
}
