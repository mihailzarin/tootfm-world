'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Music, Plus, Users, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { ClientAuth } from '@/lib/auth/client-auth';

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  _count: {
    members: number;
    tracks: number;
  };
}

export default function MyPartiesPage() {
  const router = useRouter();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      // Get World ID from localStorage for backward compatibility
      const userData = localStorage.getItem('user_data');
      let worldId = null;
      
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          worldId = parsed.worldId;
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };
      
      if (worldId) {
        headers['x-world-id'] = worldId;
      }
      
      const response = await fetch('/api/user/parties', { headers });
      const data = await response.json();
      
      setParties(data.parties || []);
      setError(null);
    } catch (err) {
      setError('Failed to load parties');
      console.error(err);
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
    ClientAuth.logout();
  };

  const isLoggedIn = () => {
    // Check both new and old auth systems
    return ClientAuth.isLoggedIn() || localStorage.getItem('world_id') !== null;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/')} className="flex items-center gap-2">
              <Music className="w-6 h-6 text-purple-400" />
              <span className="font-bold text-xl">tootFM</span>
            </button>
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => router.push('/my-parties')}
                className="text-white font-medium"
              >
                My Parties
              </button>
              <button 
                onClick={() => router.push('/profile')}
                className="text-gray-400 hover:text-white transition"
              >
                Profile
              </button>
            </nav>
          </div>
          {isLoggedIn() ? (
            <button
              onClick={handleSignOut}
              className="text-gray-400 hover:text-white transition"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => router.push('/signin')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg transition"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">My Parties</h1>
            <p className="text-gray-400">Manage your music democracy sessions</p>
          </div>
          <button
            onClick={() => router.push('/party/create')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Party
          </button>
        </div>

        {/* Parties Grid */}
        {parties.length === 0 ? (
          <div className="bg-white/5 backdrop-blur rounded-3xl p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
              <Music className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No parties yet</h2>
            <p className="text-gray-400 mb-6">Create your first party and start the music democracy!</p>
            <button
              onClick={() => router.push('/party/create')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-xl transition-all inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Your First Party
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {parties.map((party) => (
              <div
                key={party.id}
                className="bg-white/5 backdrop-blur rounded-2xl p-6 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={() => router.push(`/party/${party.code}`)}
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
                      {party._count.members}
                    </span>
                    <span className="flex items-center gap-1">
                      <Music className="w-4 h-4" />
                      {party._count.tracks}
                    </span>
                  </div>
                  <span className="text-gray-500 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(party.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-8 bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-center">
            <p className="text-red-300">{error}</p>
            <button
              onClick={fetchParties}
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
