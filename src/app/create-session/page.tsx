'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Динамический импорт QR-кода (работает только на клиенте)
const QRCode = dynamic(() => import('react-qr-code'), { ssr: false });

export default function CreateSession() {
  const [sessionId, setSessionId] = useState('');
  const [sessionUrl, setSessionUrl] = useState('');
  const [isCreated, setIsCreated] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('10');

  // Генерация ID сессии при загрузке
  useEffect(() => {
    const id = Math.random().toString(36).substring(2, 15);
    setSessionId(id);
    // В реальном приложении это будет настоящий URL
    const url = `${window.location.origin}/join/${id}`;
    setSessionUrl(url);
  }, []);

  const handleCreateSession = () => {
    // Сохраняем данные сессии
    localStorage.setItem('session_name', sessionName || 'Музыкальная сессия');
    localStorage.setItem('session_id', sessionId);
    localStorage.setItem('max_participants', maxParticipants);
    
    // Переключаемся на экран с QR-кодом
    setIsCreated(true);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Кнопка назад */}
        <Link href="/" className="absolute top-8 left-8 text-white hover:text-purple-400 transition-colors">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>

        {!isCreated ? (
          // Форма создания сессии
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
                  placeholder="Friday Night Vibes..."
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
                  <option value="unlimited">No limits</option>
                </select>
              </div>
            </div>
            
            <button
              onClick={handleCreateSession}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Let's Party! 🚀
            </button>
          </div>
        ) : (
          // QR-код и информация о сессии
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-2 text-center">
              Party created! 🎉
            </h1>
            <p className="text-gray-300 text-center mb-6">
              Ask your friends to scan the QR
            </p>
            
            {/* QR-код */}
            <div className="bg-white p-4 rounded-2xl mb-6">
              <QRCode
                value={sessionUrl}
                size={256}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            
            {/* ID сессии */}
            <div className="bg-white/5 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">ID сессии:</p>
              <p className="text-xl font-mono text-white">{sessionId}</p>
            </div>
            
            {/* Счетчик участников */}
            <div className="bg-white/5 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-1">Участников:</p>
              <p className="text-2xl font-bold text-white">1 / {maxParticipants}</p>
            </div>
            
            {/* Кнопки действий */}
            <div className="space-y-3">
              <Link href="/player" className="w-full block">
                <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                  Open player
                </button>
              </Link>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(sessionUrl);
                  alert('Ссылка скопирована!');
                }}
                className="w-full py-3 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
              >
                Share link
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}