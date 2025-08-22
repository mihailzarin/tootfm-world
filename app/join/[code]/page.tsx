"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Music, Users, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function JoinPartyPage() {
  const { user, isAuthenticated, requireAuth } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [partyInfo, setPartyInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const partyCode = params.code as string;

  useEffect(() => {
    if (requireAuth()) {
      loadPartyInfo();
    }
  }, [isAuthenticated, partyCode]);

  const loadPartyInfo = async () => {
    try {
      const response = await fetch(`/api/party/${partyCode}/info`);
      
      if (response.ok) {
        const data = await response.json();
        setPartyInfo(data);
      } else {
        setError('Party not found');
      }
    } catch (error) {
      console.error('Failed to load party info:', error);
      setError('Failed to load party information');
    }
  };

  const joinParty = async () => {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch('/api/party/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ code: partyCode })
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/party/${partyCode}`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to join party');
      }
    } catch (error) {
      console.error('Failed to join party:', error);
      setError('Failed to join party');
    } finally {
      setIsJoining(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (error && !partyInfo) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-md">
          <Link 
            href="/profile"
            className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Profile
          </Link>
          
          <div className="bg-gradient-to-br from-red-900/50 to-pink-900/50 rounded-2xl p-8 border border-red-500/20 text-center">
            <Music className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-4">Party Not Found</h1>
            <p className="text-gray-300 mb-6">{error}</p>
            <Link
              href="/profile"
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4 max-w-md">
        <Link 
          href="/profile"
          className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>
        
        <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-2xl p-8 border border-purple-500/20">
          <div className="text-center mb-6">
            <Music className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Join Party</h1>
            <p className="text-gray-300">You're about to join a music party!</p>
          </div>

          {partyInfo ? (
            <div className="space-y-4 mb-6">
              <div className="bg-white/10 rounded-lg p-4">
                <h2 className="text-xl font-bold text-white mb-2">{partyInfo.name}</h2>
                {partyInfo.description && (
                  <p className="text-gray-300 text-sm mb-3">{partyInfo.description}</p>
                )}
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Users className="w-4 h-4" />
                  {partyInfo.totalMembers} members
                </div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Party Code</h3>
                <div className="text-2xl font-mono font-bold text-purple-400">{partyCode}</div>
              </div>

              <div className="bg-white/10 rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Features</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${partyInfo.votingEnabled ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-gray-300">Democratic Voting</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${partyInfo.partyRadio ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                    <span className="text-gray-300">Party Radio Mode</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}

          <button
            onClick={joinParty}
            disabled={isJoining || !partyInfo}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300"
          >
            {isJoining ? 'Joining...' : 'Join Party'}
          </button>

          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
