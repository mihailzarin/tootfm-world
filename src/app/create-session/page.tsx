'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

export default function CreateSession() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState('');
  const [sessionUrl, setSessionUrl] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');
  const [partyCode, setPartyCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const url = `${window.location.origin}/join/`;
    setSessionUrl(url);
  }, []);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) {
      alert('Please enter a party name');
      return;
    }

    setIsCreating(true);
    
    try {
      // Получаем World ID из localStorage или создаём временный
      const worldId = localStorage.getItem('world_id') || `guest_${Date.now()}`;
      
      // Создаём party через API
      const response = await fetch('/api/party/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          hostWorldId: worldId,
          maxParticipants: parseInt(maxParticipants),
          description: sessionDescription
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Сохраняем данные party
        localStorage.setItem('current_party_id', data.party.id);
        localStorage.setItem('current_party_code', data.party.code);
        localStorage.setItem('is_host', 'true');
        
        setPartyCode(data.party.code);
        setSessionId(data.party.id);
        setSessionUrl(`${window.location.origin}/join/${data.party.code}`);
        setIsCreated(true);
      } else {
        alert('Failed to create party. Please try again.');
      }
    } catch (error) {
      console.error('Error creating party:', error);
      alert('Error creating party. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const openPlayer = () => {
    router.push(`/player?code=${partyCode}`);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <Link href="/" className="absolute top-8 left-8 text-white hover:text-purple-400 transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        {!isCreated ? (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-6 text-center">
              Host Your Music Party 🎵
            </h1>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Party Name
                </label>
                <input
                  type="text"
                  placeholder="Friday Night Vibes..."
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  placeholder="Let's vibe together..."
                  value={sessionDescription}
                  onChange={(e) => setSessionDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors h-24 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maximum participants
                </label>
                <select 
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-400 transition-colors"
                >
                  <option value="10">10 people</option>
                  <option value="25">25 people</option>
                  <option value="50">50 people</option>
                  <option value="100">100 people</option>
                  <option value="999">Unlimited</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleCreateSession}
              disabled={isCreating}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : "Let's Party! 🚀"}
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Party Created! 🎉
            </h1>
            <p className="text-gray-300 text-center mb-6">
              Ask your friends to scan the QR
            </p>
            
            <div className="bg-white p-4 rounded-2xl mb-6">
              <QRCode
                value={sessionUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Party Code:</p>
              <p className="text-2xl font-mono text-white font-bold">{partyCode}</p>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Participants:</p>
              <p className="text-2xl font-bold text-white">1 / {maxParticipants}</p>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={openPlayer}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                Open Player 🎵
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sessionUrl);
                  alert('Link copied!');
                }}
                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Share Link 📋
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
