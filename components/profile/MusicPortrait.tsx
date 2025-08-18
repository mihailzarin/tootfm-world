'use client';

import { useEffect, useState } from 'react';

interface MusicProfile {
  musicPersonality: string;
  energyLevel: number;
  diversity: number;
  topGenres: Array<{ genre: string; count: number }>;
  topTracks: Array<any>;
  topArtists: Array<any>;
}

export default function MusicPortrait({ userId }: { userId: string }) {
  const [profile, setProfile] = useState<MusicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const res = await fetch(`/api/music/analyze?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeProfile = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/music/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-white">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400 mb-4">No music profile yet</p>
        <button
          onClick={analyzeProfile}
          disabled={analyzing}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full"
        >
          {analyzing ? 'Analyzing...' : 'Analyze My Music'}
        </button>
      </div>
    );
  }

  // Преобразуем жанры для отображения
  const topGenres = profile.topGenres.slice(0, 5);
  const maxCount = Math.max(...topGenres.map(g => g.count));

  return (
    <div className="space-y-8">
      {/* Музыкальная личность */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          You are {profile.musicPersonality}
        </h2>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Music Energy</span>
              <span className="text-white">{Math.round(profile.energyLevel * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                style={{ width: `${profile.energyLevel * 100}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Taste Diversity</span>
              <span className="text-white">{Math.round(profile.diversity * 100)}%</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${profile.diversity * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Топ жанры */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4">Your Favorite Genres</h3>
        <div className="space-y-3">
          {topGenres.map((genre, index) => {
            const percentage = (genre.count / maxCount) * 100;
            const colors = [
              'from-blue-500 to-purple-500',
              'from-green-500 to-blue-500',
              'from-yellow-500 to-green-500',
              'from-orange-500 to-yellow-500',
              'from-red-500 to-orange-500'
            ];
            
            return (
              <div key={genre.genre}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-white">
                    {index + 1}. {genre.genre.charAt(0).toUpperCase() + genre.genre.slice(1)}
                  </span>
                  <span className="text-gray-400">{Math.round(percentage)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${colors[index]}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Кнопка обновления */}
      <div className="text-center">
        <button
          onClick={analyzeProfile}
          disabled={analyzing}
          className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-full"
        >
          {analyzing ? 'Updating...' : 'Update Analysis'}
        </button>
      </div>
    </div>
  );
}
