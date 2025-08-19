// components/profile/MusicPortrait.tsx
// Компонент отображения музыкального портрета с данными из Spotify и Last.fm

'use client';

import { useState, useEffect } from 'react';
import { Music, TrendingUp, Users, BarChart3, Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface MusicProfile {
  topGenres: string[];
  musicPersonality: string;
  energyLevel: number;
  diversityScore: number;
  topArtists: Array<{
    name: string;
    image?: string;
    popularity?: number;
    source?: string;
  }>;
  topTracks: Array<{
    name: string;
    artist: string;
    album?: string;
    image?: string;
    source?: string;
  }>;
  stats: {
    totalTracks: number;
    totalArtists: number;
    avgPopularity: number;
    dataSources?: string[];
  };
  sources?: string[];
}

export default function MusicPortrait({ userId }: { userId?: string }) {
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAnalyzed, setLastAnalyzed] = useState<Date | null>(null);

  useEffect(() => {
    // Проверяем, есть ли сохраненный профиль
    const savedProfile = localStorage.getItem('music_profile');
    const savedDate = localStorage.getItem('music_profile_date');
    
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
        if (savedDate) {
          setLastAnalyzed(new Date(savedDate));
        }
      } catch (e) {
        console.error('Error loading saved profile:', e);
      }
    }
    
    // Если профиля нет или он старый, анализируем
    if (!savedProfile || !savedDate || isDataOld(savedDate)) {
      analyzeMusic();
    }
  }, [userId]);

  const isDataOld = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const hoursDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24; // Данные старше 24 часов
  };

  const analyzeMusic = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🎵 Starting music analysis...');
      
      const response = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: userId || 'current' }),
      });

      const data = await response.json();
      
      if (data.success && data.profile) {
        console.log('✅ Analysis complete:', data.sources);
        setProfile(data.profile);
        setLastAnalyzed(new Date());
        
        // Сохраняем в localStorage
        localStorage.setItem('music_profile', JSON.stringify(data.profile));
        localStorage.setItem('music_profile_date', new Date().toISOString());
      } else {
        throw new Error('Failed to analyze music');
      }
    } catch (error) {
      console.error('❌ Analysis error:', error);
      setError('Failed to analyze music preferences. Please connect music services.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400 mb-4" />
        <p className="text-gray-400">Analyzing your music...</p>
        <p className="text-gray-500 text-sm mt-2">Это может занять несколько секунд</p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-8 w-8 text-red-400 mb-4" />
        <p className="text-gray-300 mb-4">{error}</p>
        <button
          onClick={analyzeMusic}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Попробовать снова
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Music className="h-12 w-12 text-gray-500 mb-4" />
        <p className="text-gray-400 mb-4">Нет данных для анализа</p>
        <button
          onClick={analyzeMusic}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Analyze Music
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок с источниками данных */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Music Portrait</h2>
          {profile.sources && profile.sources.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Данные из:</span>
              {profile.sources.map((source, idx) => (
                <span key={source} className="text-purple-400">
                  {source}
                  {idx < profile.sources.length - 1 && ','}
                </span>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={analyzeMusic}
          className="text-gray-400 hover:text-white transition-colors"
          title="Обновить анализ"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Музыкальная личность */}
      <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-xl p-6 border border-purple-500/30">
        <p className="text-gray-400 text-sm mb-2">Your Music Personality</p>
        <h3 className="text-3xl font-bold text-white">{profile.musicPersonality}</h3>
      </div>

      {/* Топ жанры */}
      <div className="bg-black/30 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Top Genres</h4>
        <div className="flex flex-wrap gap-2">
          {profile.topGenres.map((genre, index) => (
            <span
              key={genre}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 ${
                index === 0 
                  ? 'bg-purple-600 text-white' 
                  : index === 1
                  ? 'bg-pink-600 text-white'
                  : index === 2
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {genre}
            </span>
          ))}
        </div>
      </div>

      {/* Метрики */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-black/30 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Energy Level</p>
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-500 to-orange-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${profile.energyLevel}%` }}
              />
            </div>
            <p className="text-white font-bold text-xl mt-2">{profile.energyLevel}%</p>
          </div>
        </div>

        <div className="bg-black/30 rounded-xl p-6">
          <p className="text-gray-400 text-sm mb-2">Diversity Score</p>
          <div className="relative">
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${profile.diversityScore}%` }}
              />
            </div>
            <p className="text-white font-bold text-xl mt-2">{profile.diversityScore}%</p>
          </div>
        </div>
      </div>

      {/* Топ артисты */}
      {profile.topArtists && profile.topArtists.length > 0 && (
        <div className="bg-black/30 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Top Artists</h4>
          <div className="space-y-3">
            {profile.topArtists.map((artist, index) => (
              <div key={artist.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-purple-400 font-bold w-6">#{index + 1}</span>
                  <span className="text-white">{artist.name}</span>
                  {artist.source && (
                    <span className="text-xs text-gray-500">
                      ({artist.source})
                    </span>
                  )}
                </div>
                {artist.popularity !== undefined && (
                  <span className="text-gray-400 text-sm">{artist.popularity}%</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Топ треки */}
      {profile.topTracks && profile.topTracks.length > 0 && (
        <div className="bg-black/30 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-white mb-4">Top Tracks</h4>
          <div className="space-y-3">
            {profile.topTracks.map((track, index) => (
              <div key={`${track.name}-${typeof track.artist === "string" ? track.artist : (track.artist?.name || track.artist?.["#text"] || "Unknown Artist")}`} className="flex items-center gap-3">
                <span className="text-purple-400 font-bold w-6">#{index + 1}</span>
                <div className="flex-1">
                  <p className="text-white font-medium">{track.name}</p>
                  <p className="text-gray-400 text-sm">
                    {typeof track.artist === "string" ? track.artist : (track.artist?.name || track.artist?.["#text"] || "Unknown Artist")}
                    {track.album && ` • ${track.album}`}
                    {track.source && (
                      <span className="text-gray-500 ml-2">({track.source})</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Статистика */}
      <div className="bg-black/30 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-400">{profile.stats.totalTracks}</p>
            <p className="text-gray-400 text-sm">Tracks Analyzed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-pink-400">{profile.stats.totalArtists}</p>
            <p className="text-gray-400 text-sm">Artists</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{profile.stats.avgPopularity}%</p>
            <p className="text-gray-400 text-sm">Avg Popularity</p>
          </div>
        </div>
      </div>

      {/* Последнее обновление */}
      {lastAnalyzed && (
        <p className="text-center text-gray-500 text-sm">
          Последний анализ: {lastAnalyzed.toLocaleString('ru-RU')}
        </p>
      )}
    </div>
  );
}