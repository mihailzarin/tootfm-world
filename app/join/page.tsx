'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function JoinSession() {
  const [sessionCode, setSessionCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleJoin = () => {
    // Здесь будет логика присоединения
    console.log('Joining session:', sessionCode);
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

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 max-w-md w-full border border-white/20">
          <h1 className="text-3xl font-bold text-white mb-6 text-center">
            Join the Party 🎶
          </h1>
          
          <div className="space-y-6">
            {/* QR сканер (заглушка) */}
            <div>
              <button
                onClick={() => setIsScanning(!isScanning)}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h2M8 20H6m-2-4v-2m0-4v-2m0-4h2m10 0h2M4 8h16" />
                </svg>
                {isScanning ? 'Остановить сканирование' : 'Сканировать QR-код'}
              </button>
              
              {isScanning && (
                <div className="mt-4 bg-black/50 rounded-xl p-8 text-center">
                  <svg className="w-16 h-16 mx-auto text-white mb-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-300">Камера запрашивается...</p>
                  <p className="text-sm text-gray-400 mt-2">Наведите камеру на QR-код</p>
                </div>
              )}
            </div>
            
            {/* Разделитель */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-gray-400">или</span>
              </div>
            </div>
            
            {/* Ввод кода вручную */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter party code...
              </label>
              <input
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value)}
                placeholder="Например: abc123xyz"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 transition-colors font-mono text-center text-lg"
              />
            </div>
            
            <button
              onClick={handleJoin}
              disabled={!sessionCode}
              className={`w-full py-4 font-semibold rounded-xl transition-all duration-200 ${
                sessionCode
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-white/5 text-gray-500 cursor-not-allowed'
              }`}
            >
              Jump In! 🎉
            </button>
            
            {/* Последние сессии */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-3">Недавние сессии:</p>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <p className="text-white font-medium">Вечеринка у Михаила</p>
                  <p className="text-xs text-gray-400">2 часа назад • 8 участников</p>
                </button>
                <button className="w-full text-left px-4 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                  <p className="text-white font-medium">Офисный пятничный джем</p>
                  <p className="text-xs text-gray-400">Вчера • 15 участников</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}