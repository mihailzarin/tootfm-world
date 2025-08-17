// =====================================================
// LAST.FM DATA TRANSFORMER
// Преобразует данные Last.fm в единый формат
// =====================================================

import { Track, Artist, PlayHistory } from '../types';

export class LastFmTransformer {
  
  transformTracks(lastFmTracks: any[]): Track[] {
    if (!Array.isArray(lastFmTracks)) return [];
    return lastFmTracks.map(track => this.transformTrack(track));
  }

  transformTrack(lastFmTrack: any): Track {
    const id = this.generateTrackId(lastFmTrack);
    const imageUrl = this.extractImageUrl(lastFmTrack.image);
    
    return {
      id: `lastfm:${id}`,
      service: 'lastfm',
      originalId: id,
      title: lastFmTrack.name || 'Unknown Track',
      artist: this.extractArtistName(lastFmTrack),
      album: lastFmTrack.album?.['#text'] || lastFmTrack.album?.name,
      imageUrl,
      thumbnailUrl: imageUrl,
      externalUrl: lastFmTrack.url || this.generateLastFmUrl(lastFmTrack),
      duration: parseInt(lastFmTrack.duration) * 1000 || undefined,
      playCount: parseInt(lastFmTrack.playcount) || undefined,
      weight: this.calculateWeight(lastFmTrack)
    };
  }

  transformArtists(lastFmArtists: any[]): Artist[] {
    if (!Array.isArray(lastFmArtists)) return [];
    return lastFmArtists.map(artist => this.transformArtist(artist));
  }

  transformArtist(lastFmArtist: any): Artist {
    const id = lastFmArtist.mbid || this.generateArtistId(lastFmArtist.name);
    const imageUrl = this.extractImageUrl(lastFmArtist.image);
    
    return {
      id: `lastfm:${id}`,
      service: 'lastfm',
      originalId: id,
      name: lastFmArtist.name || 'Unknown Artist',
      imageUrl,
      externalUrl: lastFmArtist.url,
      playCount: parseInt(lastFmArtist.playcount) || undefined,
      weight: this.calculateArtistWeight(lastFmArtist)
    };
  }

  transformRecentTracks(lastFmRecentTracks: any[]): PlayHistory[] {
    if (!Array.isArray(lastFmRecentTracks)) return [];
    
    return lastFmRecentTracks
      .filter(track => track.date)
      .map(track => ({
        track: this.transformTrack(track),
        playedAt: new Date(parseInt(track.date.uts) * 1000),
        context: 'lastfm'
      }));
  }

  private extractArtistName(track: any): string {
    if (typeof track.artist === 'string') return track.artist;
    if (track.artist?.name) return track.artist.name;
    if (track.artist?.['#text']) return track.artist['#text'];
    return 'Unknown Artist';
  }

  private extractImageUrl(images: any): string | undefined {
    if (!images || !Array.isArray(images)) return undefined;
    
    const sizes = ['extralarge', 'large', 'medium', 'small'];
    for (const size of sizes) {
      const image = images.find(img => img.size === size);
      if (image && image['#text']) return image['#text'];
    }
    
    const lastImage = images[images.length - 1];
    return lastImage?.['#text'] || undefined;
  }

  private generateTrackId(track: any): string {
    if (track.mbid) return track.mbid;
    const artist = this.extractArtistName(track);
    const title = track.name || 'unknown';
    return `${artist}-${title}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  private generateArtistId(artistName: string): string {
    return artistName.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  private generateLastFmUrl(track: any): string {
    const artist = this.extractArtistName(track);
    const title = track.name || 'unknown';
    const encodedArtist = encodeURIComponent(artist.replace(/ /g, '+'));
    const encodedTitle = encodeURIComponent(title.replace(/ /g, '+'));
    return `https://www.last.fm/music/${encodedArtist}/_/${encodedTitle}`;
  }

  private calculateWeight(track: any): number {
    const playcount = parseInt(track.playcount) || 0;
    return Math.min(playcount / 100, 1);
  }

  private calculateArtistWeight(artist: any): number {
    const playcount = parseInt(artist.playcount) || 0;
    return Math.min(playcount / 500, 1);
  }
}
