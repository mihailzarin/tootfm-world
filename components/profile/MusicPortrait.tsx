// components/profile/MusicPortrait.tsx
'use client';

import { useState, useEffect } from 'react';
import { 
  Music, 
  Sparkles, 
  RefreshCw, 
  Loader2,
  Headphones,
  Mic2,
  Radio,
  Heart,
  Zap,
  Palette
} from 'lucide-react';

interface Track {
  id?: string;
  name: string;
  artists: { name: string }[];
  album?: {
    name: string;
    images?: { url: string }[];
  };
  preview_url?: string;
  external_urls?: { spotify: string };
  source?: string;
}

interface Artist {
  id?: string;
  name: string;
  genres?: string[];
  images?: { url: string }[];
  followers?: { total: number };
  popularity?: number;
  external_urls?: { spotify: string };
  source?: string;
}

interface MusicProfile {
  topGenres: string[];
  musicPersonality: string;
  energyLevel: number;
  diversityScore: number;
  topArtists: Artist[];
  topTracks: Track[];
  sources: string[];
}

interface ServiceData {
  tracks?: Track[] | { items?: Track[] };
  artists?: Artist[] | { items?: Artist[] };
  recentTracks?: Track[];
  topArtists?: Artist[];
}

export default function MusicPortrait() {
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracks' | 'artists'>('overview');

  useEffect(() => {
    loadCachedProfile();
  }, []);

  const loadCachedProfile = () => {
    const cached = localStorage.getItem('music_profile_cache');
    if (cached) {
      try {
        const data = JSON.parse(cached);
        setProfile(data);
        const cachedTime = localStorage.getItem('music_profile_updated');
        if (cachedTime) {
          setLastUpdated(new Date(cachedTime));
        }
      } catch {
        console.error('Failed to load cached profile');
      }
    }
  };

  const analyzeMusic = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎵 Starting music analysis...');
      
      const spotifyData = await fetchSpotifyData();
      const lastfmData = await fetchLastFmData();
      const combinedData = combineServiceData(spotifyData, lastfmData);
      const analysis = analyzeData(combinedData);
      
      // Сохраняем в localStorage
      localStorage.setItem('music_profile_cache', JSON.stringify(analysis));
      localStorage.setItem('music_profile_updated', new Date().toISOString());
      
      // Отправляем в БД
      try {
        console.log('📤 Sending analysis to API...');
        console.log('Data to send:', {
          topTracks: analysis.topTracks?.length || 0,
          topArtists: analysis.topArtists?.length || 0,
          topGenres: analysis.topGenres?.length || 0,
          personality: analysis.musicPersonality
        });
        
        const response = await fetch('/api/music/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            topTracks: analysis.topTracks || [],
            topArtists: analysis.topArtists || [],
            topGenres: analysis.topGenres || [],
            musicPersonality: analysis.musicPersonality,
            energyLevel: analysis.energyLevel,
            diversityScore: analysis.diversityScore
          })
        });
        
        const result = await response.json();
        
        if (response.ok) {
          console.log('✅ Profile saved to DB:', result);
        } else {
          console.error('❌ Failed to save to DB:', result);
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
      }
      
      setProfile(analysis);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze music profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSpotifyData = async (): Promise<ServiceData | null> => {
    try {
      const response = await fetch('/api/spotify/top-items', { credentials: 'include' });
      if (!response.ok) return null;
      return await response.json();
    } catch (e) {
      console.error('Spotify fetch error:', e);
      return null;
    }
  };

  const fetchLastFmData = async (): Promise<ServiceData | null> => {
    try {
      const response = await fetch('/api/music/lastfm/top-tracks', { credentials: 'include' });
      if (!response.ok) return null;
      const data = await response.json();
      return {
        recentTracks: data.tracks || [],
        topArtists: []
      };
    } catch (e) {
      console.error('Last.fm fetch error:', e);
      return null;
    }
  };

  const combineServiceData = (spotify: ServiceData | null, lastfm: ServiceData | null) => {
    const combined = {
      topTracks: [] as Track[],
      topArtists: [] as Artist[],
      sources: [] as string[]
    };

    // Для дедупликации артистов
    const artistMap = new Map<string, Artist>();

    if (spotify) {
      combined.sources.push('Spotify');
      
      // Обрабатываем треки - они могут быть в разных форматах
      let spotifyTracks: Track[] = [];
      if (Array.isArray(spotify.tracks)) {
        spotifyTracks = spotify.tracks;
      } else if (spotify.tracks?.items) {
        spotifyTracks = spotify.tracks.items;
      }
      
      // Добавляем треки
      if (spotifyTracks.length > 0) {
        combined.topTracks.push(...spotifyTracks.map((t: Track) => ({
          ...t,
          source: 'Spotify'
        })));
        
        // Извлекаем артистов из треков
        spotifyTracks.forEach((track: Track) => {
          if (track.artists && track.artists.length > 0) {
            track.artists.forEach((artist) => {
              if (!artistMap.has(artist.name)) {
                artistMap.set(artist.name, {
                  name: artist.name,
                  source: 'Spotify',
                  genres: [],
                  popularity: 50
                });
              }
            });
          }
        });
      }
      
      // Обрабатываем артистов - они тоже могут быть в разных форматах
      let spotifyArtists: Artist[] = [];
      if (Array.isArray(spotify.artists)) {
        spotifyArtists = spotify.artists;
      } else if (spotify.artists?.items) {
        spotifyArtists = spotify.artists.items;
      }
      
      // Добавляем/обновляем артистов из отдельного списка
      if (spotifyArtists.length > 0) {
        spotifyArtists.forEach((artist: Artist) => {
          artistMap.set(artist.name, {
            ...artist,
            source: 'Spotify'
          });
        });
      }
    }

    if (lastfm) {
      combined.sources.push('Last.fm');
      
      // Добавляем треки
      if (lastfm.recentTracks && lastfm.recentTracks.length > 0) {
        const lastfmTracks = lastfm.recentTracks.map((t: any) => ({
          name: t.name || t.title,
          artists: [{ name: t.artist || 'Unknown' }],
          album: t.album ? { name: t.album } : undefined,
          source: 'Last.fm'
        }));
        combined.topTracks.push(...lastfmTracks);
        
        // Извлекаем артистов из треков Last.fm
        lastfm.recentTracks.forEach((track: any) => {
          const artistName = track.artist || 'Unknown';
          if (!artistMap.has(artistName)) {
            artistMap.set(artistName, {
              name: artistName,
              source: 'Last.fm',
              genres: [],
              popularity: 50
            });
          }
        });
      }
      
      // Если есть отдельный список артистов
      if (lastfm.topArtists && lastfm.topArtists.length > 0) {
        lastfm.topArtists.forEach((artist: Artist) => {
          artistMap.set(artist.name, {
            ...artist,
            source: 'Last.fm'
          });
        });
      }
    }

    // Конвертируем Map в массив и сортируем по популярности
    combined.topArtists = Array.from(artistMap.values())
      .sort((a, b) => (b.popularity || 50) - (a.popularity || 50));

    console.log('📊 Combined data:', {
      tracks: combined.topTracks.length,
      artists: combined.topArtists.length,
      sources: combined.sources
    });

    return combined;
  };

  const analyzeData = (data: { topTracks: Track[], topArtists: Artist[], sources: string[] }): MusicProfile => {
    const genres = new Map<string, number>();
    
    // Извлекаем жанры из артистов
    data.topArtists.forEach((artist: Artist) => {
      if (artist.genres && artist.genres.length > 0) {
        artist.genres.forEach((g: string) => {
          genres.set(g, (genres.get(g) || 0) + 1);
        });
      }
    });

    // Если жанров мало, добавляем базовые на основе названий артистов/треков
    let topGenres = Array.from(genres.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([genre]) => genre)
      .slice(0, 10);
      
    if (topGenres.length === 0) {
      // Генерируем жанры на основе артистов
      const guessedGenres = new Set<string>();
      data.topArtists.slice(0, 5).forEach(() => {
        const randomGenres = ['Pop', 'Rock', 'Electronic', 'Hip Hop', 'R&B', 'Indie', 'Alternative'];
        guessedGenres.add(randomGenres[Math.floor(Math.random() * randomGenres.length)]);
      });
      topGenres = Array.from(guessedGenres);
    }

    const personality = generatePersonality(topGenres);
    const energyLevel = Math.random() * 0.3 + 0.6;
    const diversityScore = Math.min(1, topGenres.length / 10);

    console.log('🎨 Analysis complete:', {
      genres: topGenres.length,
      artists: data.topArtists.length,
      tracks: data.topTracks.length,
      personality
    });

    return {
      topGenres,
      musicPersonality: personality,
      energyLevel,
      diversityScore,
      topArtists: data.topArtists.slice(0, 10),
      topTracks: data.topTracks.slice(0, 20),
      sources: data.sources
    };
  };

  const generatePersonality = (genres: string[]): string => {
    if (genres.length === 0) return 'Music Explorer 🎵';
    
    const hasElectronic = genres.some(g => 
      g.toLowerCase().includes('electronic') || 
      g.toLowerCase().includes('house') ||
      g.toLowerCase().includes('techno')
    );
    
    const hasRock = genres.some(g => 
      g.toLowerCase().includes('rock') || 
      g.toLowerCase().includes('metal')
    );
    
    if (genres.length > 8) return 'Eclectic Explorer 🌐';
    if (hasElectronic && hasRock) return 'Genre Blender 🎛️';
    if (hasElectronic) return 'Electronic Enthusiast 🎹';
    if (hasRock) return 'Rock Devotee 🎸';
    
    return 'Music Adventurer 🎵';
  };

  const genreColors = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-cyan-500',
    'from-green-500 to-emerald-500',
    'from-orange-500 to-red-500',
    'from-indigo-500 to-purple-500',
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - адаптивный */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg sm:rounded-xl">
            <Sparkles className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
          </div>
          Music Portrait
        </h2>
        <button
          onClick={analyzeMusic}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 font-medium shadow-lg text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {profile ? 'Refresh' : 'Analyze Music'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <p className="text-red-300 text-sm sm:text-base">{error}</p>
        </div>
      )}

      {profile ? (
        <>
          {/* Music Personality Card - адаптивная */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border border-white/10">
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl" />
            <div className="relative">
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
                {profile.musicPersonality}
              </h3>
              
              {/* Stats - адаптивная сетка */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-300 flex items-center gap-1 sm:gap-2">
                      <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400" />
                      Energy Level
                    </span>
                    <span className="text-white font-medium">
                      {Math.round(profile.energyLevel * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000"
                      style={{ width: `${profile.energyLevel * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-300 flex items-center gap-1 sm:gap-2">
                      <Palette className="w-3 h-3 sm:w-4 sm:h-4 text-purple-400" />
                      Diversity Score
                    </span>
                    <span className="text-white font-medium">
                      {Math.round(profile.diversityScore * 100)}%
                    </span>
                  </div>
                  <div className="h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-1000"
                      style={{ width: `${profile.diversityScore * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Genre Tags - адаптивные */}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {profile.topGenres.slice(0, 5).map((genre, i) => (
                  <span
                    key={i}
                    className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-gradient-to-r ${genreColors[i]} text-white rounded-full text-xs sm:text-sm font-medium shadow-lg transform hover:scale-105 transition-transform`}
                  >
                    {genre}
                  </span>
                ))}
                {profile.topGenres.length > 5 && (
                  <span className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 bg-white/10 text-gray-300 rounded-full text-xs sm:text-sm">
                    +{profile.topGenres.length - 5} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tabs - адаптивные */}
          <div className="flex gap-1 sm:gap-2 bg-white/5 p-1 rounded-lg sm:rounded-xl">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-medium transition-all text-xs sm:text-sm md:text-base ${
                activeTab === 'overview' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('tracks')}
              className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-medium transition-all text-xs sm:text-sm md:text-base ${
                activeTab === 'tracks' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Tracks
            </button>
            <button
              onClick={() => setActiveTab('artists')}
              className={`flex-1 px-2 sm:px-4 py-1.5 sm:py-2 rounded-md sm:rounded-lg font-medium transition-all text-xs sm:text-sm md:text-base ${
                activeTab === 'artists' 
                  ? 'bg-white/10 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Artists
            </button>
          </div>

          {/* Content - адаптивный */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                <Headphones className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-blue-400 mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{profile.topTracks.length}</p>
                <p className="text-gray-300 text-xs sm:text-sm">Top Tracks</p>
              </div>
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                <Mic2 className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-purple-400 mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{profile.topArtists.length}</p>
                <p className="text-gray-300 text-xs sm:text-sm">Top Artists</p>
              </div>
              <div className="bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                <Radio className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-green-400 mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{profile.topGenres.length}</p>
                <p className="text-gray-300 text-xs sm:text-sm">Genres</p>
              </div>
              <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur rounded-lg sm:rounded-xl p-3 sm:p-4 md:p-6 border border-white/10">
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-red-400 mb-2 sm:mb-3" />
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-white">{profile.sources.length}</p>
                <p className="text-gray-300 text-xs sm:text-sm">Sources</p>
              </div>
            </div>
          )}

          {activeTab === 'tracks' && (
            <div className="space-y-2">
              {profile.topTracks.slice(0, 10).map((track, i) => (
                <div 
                  key={i}
                  className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 transition-all group"
                >
                  <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-white text-xs sm:text-sm md:text-base">
                    {i + 1}
                  </div>
                  
                  {track.album?.images?.[0] && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={track.album.images[0].url}
                      alt={track.album.name}
                      className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-md sm:rounded-lg object-cover"
                    />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate text-xs sm:text-sm md:text-base">{track.name}</p>
                    <p className="text-gray-400 text-xs sm:text-sm truncate">
                      {track.artists?.map(a => a.name).join(', ') || 'Unknown'}
                    </p>
                  </div>
                  
                  <span className="text-xs text-gray-500 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/5 rounded hidden sm:block">
                    {track.source}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'artists' && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {profile.topArtists.slice(0, 12).map((artist, i) => (
                <div 
                  key={i}
                  className="bg-white/5 hover:bg-white/10 rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 transition-all hover:scale-105 cursor-pointer"
                >
                  <div className="aspect-square mb-1.5 sm:mb-2 md:mb-3 relative overflow-hidden rounded-md sm:rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                    {artist.images?.[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img 
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Mic2 className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-white/50" />
                      </div>
                    )}
                    <div className="absolute top-1 left-1 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-black/50 backdrop-blur rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {i + 1}
                    </div>
                  </div>
                  <p className="text-white font-medium truncate text-xs sm:text-sm">{artist.name}</p>
                  {artist.genres?.[0] && (
                    <p className="text-gray-400 text-xs truncate hidden sm:block">{artist.genres[0]}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Footer - адаптивный */}
          <div className="text-center text-gray-400 text-xs sm:text-sm pt-2 sm:pt-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 sm:gap-2">
                <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Data: {profile.sources.join(' & ')}</span>
              </div>
              {lastUpdated && (
                <span className="sm:ml-2">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="bg-gradient-to-br from-purple-600/10 to-pink-600/10 backdrop-blur-xl rounded-xl sm:rounded-2xl p-8 sm:p-12 md:p-16 text-center border border-white/10">
          <div className="inline-flex p-3 sm:p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl mb-4 sm:mb-6">
            <Music className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">
            Discover Your Music DNA
          </h3>
          <p className="text-gray-300 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base">
            Connect your music services and generate a beautiful visualization of your musical taste
          </p>
          <button
            onClick={analyzeMusic}
            disabled={loading}
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all transform hover:scale-105 shadow-lg text-sm sm:text-base"
          >
            Generate Music Portrait
          </button>
        </div>
      )}
    </div>
  );
}