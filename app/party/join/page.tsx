'use client';

export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Music, MapPin, Users, Clock, Search, QrCode, Loader2 } from 'lucide-react';

interface PublicParty {
  code: string;
  name: string;
  description?: string;
  memberCount: number;
  trackCount: number;
  distance?: number;
  createdAt: string;
}

export default function JoinPartyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicParties, setPublicParties] = useState<PublicParty[]>([]);
  const [loadingParties, setLoadingParties] = useState(false);
  const [locationAllowed, setLocationAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if code in URL params (from QR/link)
    const urlCode = searchParams?.get('code');
    if (urlCode) {
      setCode(urlCode.toUpperCase());
      // Auto-join if code provided
      handleJoinWithCode(urlCode.toUpperCase());
    }

    // Load public parties
    loadPublicParties();
  }, [searchParams]);

  const loadPublicParties = async () => {
    setLoadingParties(true);
    try {
      // For now, just get recent parties (later add geo-sorting)
      const response = await fetch('/api/party/discover');
      if (response.ok) {
        const data = await response.json();
        setPublicParties(data.parties || []);
      }
    } catch (error) {
      console.error('Error loading public parties:', error);
    } finally {
      setLoadingParties(false);
    }
  };

  const handleJoinWithCode = async (partyCode?: string) => {
    const codeToUse = partyCode || code.toUpperCase();
    
    if (!codeToUse || codeToUse.length < 6) {
      setError('Please enter a valid party code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // First check if party exists
      const response = await fetch(`/api/party/${codeToUse}`);
      const data = await response.json();

      if (data.success && data.party) {
        // Navigate to party page
        router.push(`/party/${codeToUse}`);
      } else {
        setError(data.error || "We couldn't find that party");
      }
    } catch (error) {
      console.error('Error joining party:', error);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (value: string) => {
    // Auto-uppercase and limit to alphanumeric
    const formatted = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCode(formatted);
    
    // Clear error when typing
    if (error) setError('');
  };

  const requestLocation = async () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationAllowed(true);
          // Re-load parties with location
          loadPublicPartiesWithLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location error:', error);
          setLocationAllowed(false);
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  };

  const loadPublicPartiesWithLocation = async (lat: number, lng: number) => {
    setLoadingParties(true);
    try {
      const response = await fetch(`/api/party/discover?lat=${lat}&lng=${lng}`);
      if (response.ok) {
        const data = await response.json();
        setPublicParties(data.parties || []);
      }
    } catch (error) {
      console.error('Error loading parties with location:', error);
    } finally {
      setLoadingParties(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-black text-white">
      <div className="max-w-4xl mx-auto p-6 pt-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
            <Music className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Join the Party 🎶</h1>
          <p className="text-gray-400">Enter a code or browse nearby parties</p>
        </div>

        {/* Join by Code */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Have a party code?</h2>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              placeholder="e.g., ABC123"
              maxLength={8}
              className="flex-1 px-4 py-3 bg-black/30 rounded-xl border border-white/10 focus:border-purple-500 focus:outline-none text-white placeholder-gray-500 font-mono text-lg uppercase"
              onKeyPress={(e) => e.key === 'Enter' && handleJoinWithCode()}
            />
            <button
              onClick={() => handleJoinWithCode()}
              disabled={loading || code.length < 6}
              className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                loading || code.length < 6
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Jump In!
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-4 mt-4">
            <button className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <QrCode className="w-5 h-5" />
              <span className="text-sm">Scan QR code</span>
            </button>
          </div>
        </div>

        {/* Discover Parties */}
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Discover Parties</h2>
            
            {locationAllowed === null && (
              <button
                onClick={requestLocation}
                className="text-sm bg-purple-600/30 hover:bg-purple-600/40 px-3 py-1 rounded-full flex items-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                Find nearby
              </button>
            )}
          </div>

          {locationAllowed === false && (
            <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-300 text-sm">
                Enable location to see parties near you
              </p>
            </div>
          )}

          {loadingParties ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-gray-400">Loading parties...</p>
            </div>
          ) : publicParties.length > 0 ? (
            <div className="space-y-3">
              {publicParties.map((party) => (
                <button
                  key={party.code}
                  onClick={() => router.push(`/party/${party.code}`)}
                  className="w-full bg-black/30 hover:bg-black/40 rounded-xl p-4 transition-all text-left"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white">{party.name}</h3>
                      {party.description && (
                        <p className="text-gray-400 text-sm mt-1">{party.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {party.memberCount} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {party.trackCount} tracks
                        </span>
                        {party.distance && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {party.distance < 1 ? 
                              `${Math.round(party.distance * 1000)}m` : 
                              `${party.distance.toFixed(1)}km`
                            }
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-purple-400 font-mono text-sm">
                      {party.code}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Music className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>No public parties found</p>
              <p className="text-sm mt-2">Create your own or join with a code!</p>
            </div>
          )}
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}