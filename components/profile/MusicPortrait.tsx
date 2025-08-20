// components/profile/MusicPortrait.tsx
'use client';

import { useState, useEffect } from 'react';
import { Music, TrendingUp, Users, Sparkles, RefreshCw, Loader2 } from 'lucide-react';

interface MusicProfile {
  topGenres: string[];
  musicPersonality: string;
  energyLevel: number;
  diversityScore: number;
  topArtists: any[];
  topTracks: any[];
  sources: string[];
}

export default function MusicPortrait() {
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
      } catch (e) {
        console.error('Failed to load cached profile');
      }
    }
  };

  const analyzeMusic = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🎵 Starting music analysis...');
      
      // Собираем данные из cookies
      const spotifyData = await fetchSpotifyData();
      const lastfmData = await fetchLastFmData();
      
      console.log('📊 Raw data collected:', {
        spotify: !!spotifyData,
        lastfm: !!lastfmData
      });
      
      // Объединяем данные
      const combinedData = combineServiceData(spotifyData, lastfmData);
      
      console.log('🔄 Combined data:', {
        tracks: combinedData.topTracks.length,
        artists: combinedData.topArtists.length,
        sources: combinedData.sources
      });
      
      // Анализируем
      const analysis = analyzeData(combinedData);
      
      console.log('✅ Analysis complete:', analysis);
      
      // Сохраняем в localStorage для UI
      localStorage.setItem('music_profile_cache', JSON.stringify(analysis));
      localStorage.setItem('music_profile_updated', new Date().toISOString());
      
      // ВАЖНО: Отправляем на сервер для сохранения в БД
      try {
        const response = await fetch('/api/music/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topTracks: combinedData.topTracks,
            topArtists: combinedData.topArtists,
            topGenres: analysis.topGenres,
            musicPersonality: analysis.musicPersonality,
            energyLevel: analysis.energyLevel,
            diversityScore: analysis.diversityScore
          })
        });

        if (response.ok) {
          console.log('✅ Profile saved to database');
          const result = await response.json();
          console.log('📊 Server response:', result);
        } else {
          console.error('❌ Failed to save profile to database:', response.status);
        }
      } catch (dbError) {
        console.error('❌ Database save error:', dbError);
        // Продолжаем работу даже если БД не доступна
      }
      
      setProfile(analysis);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('Analysis error:', err);
      setError('Failed to analyze music profile. Please try again.');
      
      // Загружаем демо-данные при ошибке
      loadDemoProfile();
    } finally {
      setLoading(false);
    }
  };

  const fetchSpotifyData = async () => {
    try {
      console.log('📊 Fetching Spotify data...');
      const response = await fetch('/api/spotify/top-items');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ Spotify not connected or token expired');
          return null;
        }
        console.error('❌ Spotify API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ Spotify data received:', {
        tracks: data.tracks?.items?.length || 0,
        artists: data.artists?.items?.length || 0
      });
      
      return data;
    } catch (e) {
      console.error('❌ Spotify fetch error:', e);
      return null;
    }
  };

  const fetchLastFmData = async () => {
    try {
      console.log('📊 Fetching Last.fm data...');
      const response = await fetch('/api/music/lastfm/top-tracks');
      
      if (!response.ok) {
        if (response.status === 401) {
          console.log('⚠️ Last.fm not connected');
          return null;
        }
        console.error('❌ Last.fm API error:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('✅ Last.fm data received:', {
        tracks: data.tracks?.length || 0
      });
      
      // Адаптируем формат Last.fm под ожидаемую структуру
      return {
        recentTracks: data.tracks || [],
        topArtists: [] // Last.fm endpoint для артистов отдельный, если нужно
      };
    } catch (e) {
      console.error('❌ Last.fm fetch error:', e);
      return null;
    }
  };

  const combineServiceData = (spotify: any, lastfm: any) => {
    const combined = {
      topTracks: [] as any[],
      topArtists: [] as any[],
      sources: [] as string[]
    };

    // Добавляем данные Spotify
    if (spotify) {
      combined.sources.push('Spotify');
      if (spotify.tracks?.items) {
        combined.topTracks.push(...spotify.tracks.items.map((t: any) => ({
          ...t,
          source: 'Spotify'
        })));
      }
      if (spotify.artists?.items) {
        combined.topArtists.push(...spotify.artists.items.map((a: any) => ({
          ...a,
          source: 'Spotify'
        })));
      }
    }

    // Добавляем данные Last.fm
    if (lastfm) {
      combined.sources.push('Last.fm');
      if (lastfm.recentTracks) {
        // Адаптируем формат Last.fm треков
        combined.topTracks.push(...lastfm.recentTracks.map((t: any) => ({
          name: t.title || t.name,
          artists: [{ name: t.artist }],
          album: { name: t.album },
          source: 'Last.fm'
        })));
      }
      if (lastfm.topArtists && lastfm.topArtists.length > 0) {
        combined.topArtists.push(...lastfm.topArtists.map((a: any) => ({
          ...a,
          source: 'Last.fm'
        })));
      }
    }

    console.log('🔀 Combined service data:', {
      totalTracks: combined.topTracks.length,
      totalArtists: combined.topArtists.length,
      sources: combined.sources
    });

    return combined;
  };

  const analyzeData = (data: any): MusicProfile => {
    // Извлекаем жанры
    const genres = new Set<string>();
    data.topArtists.forEach((artist: any) => {
      if (artist.genres) {
        artist.genres.forEach((g: string) => genres.add(g));
      }
      if (artist.tags) {
        artist.tags.forEach((t: any) => genres.add(t.name || t));
      }
    });

    const topGenres = Array.from(genres).slice(0, 10);

    // Если жанров нет, пробуем извлечь из имен артистов или треков
    if (topGenres.length === 0 && data.topTracks.length > 0) {
      console.log('⚠️ No genres found, using fallback genres');
      topGenres.push('Pop', 'Rock', 'Electronic'); // Fallback genres
    }

    // Определяем музыкальную личность
    const personality = generatePersonality(topGenres, data.topTracks);

    // Считаем энергию (если есть данные Spotify)
    const energyLevel = calculateEnergy(data.topTracks);

    // Считаем разнообразие
    const diversityScore = calculateDiversity(topGenres);

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

  const generatePersonality = (genres: string[], tracks: any[]): string => {
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
    
    const hasPop = genres.some(g => 
      g.toLowerCase().includes('pop')
    );
    
    const hasHipHop = genres.some(g => 
      g.toLowerCase().includes('hip') || 
      g.toLowerCase().includes('rap')
    );

    if (genres.length > 8) return 'Eclectic Explorer 🌐';
    if (hasElectronic && hasRock) return 'Genre Blender 🎛️';
    if (hasElectronic) return 'Electronic Enthusiast 🎹';
    if (hasRock) return 'Rock Devotee 🎸';
    if (hasPop) return 'Pop Connoisseur ⭐';
    if (hasHipHop) return 'Hip-Hop Head 🎤';
    
    return 'Music Adventurer 🎵';
  };

  const calculateEnergy = (tracks: any[]): number => {
    // Если есть данные об энергии от Spotify
    const energyValues = tracks
      .filter(t => t.audio_features?.energy)
      .map(t => t.audio_features.energy);
    
    if (energyValues.length > 0) {
      return energyValues.reduce((a, b) => a + b, 0) / energyValues.length;
    }
    
    // Fallback: случайное значение для демо
    return 0.65 + Math.random() * 0.2;
  };

  const calculateDiversity = (genres: string[]): number => {
    // Чем больше жанров, тем выше разнообразие
    return Math.min(1, genres.length / 10);
  };

  const loadDemoProfile = () => {
    const demo: MusicProfile = {
      topGenres: ['Pop', 'Electronic', 'Indie', 'Rock', 'Alternative'],
      musicPersonality: 'Eclectic Explorer 🌐',
      energyLevel: 0.75,
      diversityScore: 0.85,
      topArtists: [
        { name: 'Demo Artist 1', genres: ['Pop'], source: 'Demo' },
        { name: 'Demo Artist 2', genres: ['Electronic'], source: 'Demo' }
      ],
      topTracks: [
        { name: 'Demo Track 1', artists: [{name: 'Artist 1'}], source: 'Demo' },
        { name: 'Demo Track 2', artists: [{name: 'Artist 2'}], source: 'Demo' }
      ],
      sources: ['Demo Data']
    };
    
    setProfile(demo);
    console.log('📊 Loaded demo profile');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Your Music Portrait
        </h2>
        <button
          onClick={analyzeMusic}
          disabled={loading}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              {profile ? 'Refresh' : 'Analyze'}
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-300">{error}</p>
        </div>
      )}

      {profile ? (
        <>
          {/* Music Personality */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-3xl font-bold text-white mb-2">
              {profile.musicPersonality}
            </h3>
            <div className="flex gap-4 text-gray-300">
              <span>Energy: {Math.round(profile.energyLevel * 100)}%</span>
              <span>•</span>
              <span>Diversity: {Math.round(profile.diversityScore * 100)}%</span>
            </div>
          </div>

          {/* Top Genres */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Genres</h3>
            <div className="flex flex-wrap gap-2">
              {profile.topGenres.map((genre, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-purple-600/30 text-purple-300 rounded-full text-sm"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <Music className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">{profile.topTracks.length}</p>
              <p className="text-gray-400">Analyzed Tracks</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6">
              <Users className="w-8 h-8 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">{profile.topArtists.length}</p>
              <p className="text-gray-400">Favorite Artists</p>
            </div>
          </div>

          {/* Sources */}
          {profile.sources.length > 0 && (
            <div className="text-center text-gray-400 text-sm">
              Data from: {profile.sources.join(', ')}
              {lastUpdated && (
                <span className="ml-2">
                  • Updated {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="bg-white/10 backdrop-blur rounded-xl p-12 text-center">
          <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No Music Profile Yet
          </h3>
          <p className="text-gray-400 mb-6">
            Connect your music services and click Analyze to generate your music portrait
          </p>
          <button
            onClick={analyzeMusic}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition"
          >
            Generate Music Portrait
          </button>
        </div>
      )}
    </div>
  );
}