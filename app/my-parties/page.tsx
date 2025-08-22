"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { Music, Users, Calendar, ArrowLeft, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Party {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
  totalMembers: number;
  totalTracks: number;
  playlistGenerated: boolean;
  votingEnabled: boolean;
  partyRadio: boolean;
  role: 'HOST' | 'MEMBER';
}

export default function MyPartiesPage() {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const [parties, setParties] = useState<Party[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (requireAuth()) {
      loadParties();
    }
  }, [isAuthenticated]);

  const loadParties = async () => {
    try {
      const response = await fetch('/api/parties/my');
      
      if (response.ok) {
        const data = await response.json();
        setParties(data);
      }
    } catch (error) {
      console.error('Failed to load parties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading your parties...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">My Parties</h1>
              <p className="text-gray-300">Manage your music parties and playlists</p>
            </div>
            <Link
              href="/party/create"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Party
            </Link>
          </div>
        </div>

        {/* Parties Grid */}
        {parties.length === 0 ? (
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-12 border border-purple-500/20 text-center">
            <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">No Parties Yet</h2>
            <p className="text-gray-300 mb-6">
              You haven't created or joined any parties yet. Start by creating your first party!
            </p>
            <Link
              href="/party/create"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Create Your First Party
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {parties.map(party => (
              <div key={party.id} className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{party.name}</h3>
                    {party.description && (
                      <p className="text-gray-300 text-sm mb-2">{party.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    party.role === 'HOST' 
                      ? 'bg-purple-500/20 text-purple-400' 
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {party.role}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{party.totalMembers}</div>
                    <div className="text-gray-300 text-xs">Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{party.totalTracks}</div>
                    <div className="text-gray-300 text-xs">Tracks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{party.code}</div>
                    <div className="text-gray-300 text-xs">Code</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {party.votingEnabled && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                      Voting Enabled
                    </span>
                  )}
                  {party.partyRadio && (
                    <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">
                      Party Radio
                    </span>
                  )}
                  {party.playlistGenerated && (
                    <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
                      Playlist Ready
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    {new Date(party.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Link
                    href={`/party/${party.code}`}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
