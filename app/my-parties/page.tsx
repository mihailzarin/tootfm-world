'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Plus, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  totalMembers?: number;
  totalTracks?: number;
  _count?: {
    members: number;
    tracks: number;
  };
}

export default function MyPartiesPage() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthAndFetchParties();
  }, []);

  const checkAuthAndFetchParties = async () => {
    // Проверяем авторизацию через localStorage
    const userData = localStorage.getItem('user_data');
    
    if (!userData) {
      // Если нет данных пользователя, перенаправляем на главную
      router.push('/');
      return;
    }

    setIsAuthenticated(true);
    
    // Загружаем parties
    try {
      const response = await fetch('/api/user/parties', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch parties');
      }

      const data = await response.json();
      console.log('Fetched parties:', data);
      
      setParties(data.parties || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching parties:', err);
      setError('Failed to load parties');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleSignOut = () => {
    // Очищаем все данные
    localStorage.clear();
    sessionStorage.clear();
    
    // Удаляем cookies
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Будет редирект на главную
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-xl">tootFM</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-white font-medium">My Parties</span>
              <Link href="/profile" className="text-gray-400 hover:text-white transition">
                Profile
              </Link>
            </nav>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-400 hover:text-white transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Parties</h1>
            <p className="text-gray-400">Manage your music democracy sessions</p>
          </div>
          <Link
            href="/party/create"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Party
          </Link>
        </div>

        {/* Parties Grid */}
        {parties.length === 0 ? (
          <div className="bg-white/5 backdrop-blur rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
              <Music className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No parties yet</h2>
            <p className="text-gray-400 mb-6">Create your first party and start the music democracy!</p>
            <Link
              href="/party/create"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Party
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party) => (
              <Link
                key={party.id}
                href={`/party/${party.code}`}
                className="bg-white/5 backdrop-blur rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group block"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{party.name}</h3>
                    <p className="text-purple-400 font-mono text-sm">#{party.code}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
                
                {party.description && (
                  <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                    {party.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-gray-400">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {party.totalMembers || party._count?.members || 1}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      {party.totalTracks || party._count?.tracks || 0}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(party.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={checkAuthAndFetchParties}
              className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}