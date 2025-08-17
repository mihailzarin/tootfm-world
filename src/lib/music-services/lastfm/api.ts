// =====================================================
// LAST.FM API WRAPPER
// =====================================================

import * as crypto from 'crypto';

export class LastFmApi {
  private baseUrl = 'https://ws.audioscrobbler.com/2.0/';
  
  constructor(
    private apiKey: string,
    private apiSecret: string
  ) {}

  async getAuthToken(): Promise<string> {
    const response = await this.makeRequest('auth.getToken', {}, true);
    return response.token;
  }

  async getSession(token: string): Promise<{ key: string; name: string }> {
    const response = await this.makeRequest('auth.getSession', { token }, true);
    return response.session;
  }

  async getUserInfo(username: string): Promise<any> {
    const response = await this.makeRequest('user.getInfo', { user: username });
    return response.user;
  }

  async getUserTopTracks(username: string, period: string = '6month', limit: number = 50): Promise<any> {
    return this.makeRequest('user.getTopTracks', {
      user: username,
      period,
      limit: limit.toString()
    });
  }

  async getUserTopArtists(username: string, period: string = '6month', limit: number = 50): Promise<any> {
    return this.makeRequest('user.getTopArtists', {
      user: username,
      period,
      limit: limit.toString()
    });
  }

  async getUserRecentTracks(username: string, limit: number = 50): Promise<any> {
    return this.makeRequest('user.getRecentTracks', {
      user: username,
      limit: limit.toString(),
      extended: '1'
    });
  }

  private async makeRequest(
    method: string,
    params: Record<string, string> = {},
    signed: boolean = false
  ): Promise<any> {
    const allParams: Record<string, string> = {
      method,
      api_key: this.apiKey,
      format: 'json',
      ...params
    };

    if (signed) {
      allParams.api_sig = this.generateSignature(allParams);
    }

    const url = new URL(this.baseUrl);
    Object.entries(allParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Last.fm API error: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(`Last.fm API error ${data.error}: ${data.message}`);
    }

    return data;
  }

  private generateSignature(params: Record<string, string>): string {
    const sortedParams = Object.keys(params)
      .filter(key => key !== 'format' && key !== 'api_sig')
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    const stringToHash = sortedParams + this.apiSecret;
    return crypto.createHash('md5').update(stringToHash, 'utf8').digest('hex');
  }
}
