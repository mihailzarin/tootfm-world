'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleWorldIDClick = () => {
    setShowModal(true);
  };

  const confirmWorldID = () => {
    setIsLoading(true);
    // Симулируем проверку World ID
    setTimeout(() => {
      const userId = 'User_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem('user_name', userId);
      localStorage.setItem('worldid_verified', 'true');
      router.push('/');
    }, 2000);
  };

  const handleGuestLogin = () => {
    localStorage.setItem('user_name', 'Гость');
    router.push('/');
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
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
              <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome to tootFM 🎵
            </h1>
            <p className="text-gray-300">
              Join with World ID
            </p>
          </div>

          <div className="space-y-4">
            {/* World ID Button */}
            <button
              onClick={handleWorldIDClick}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              {isLoading ? "Проверка..." : "Войти через World ID"}
            </button>
            
            {/* Разделитель */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-transparent text-gray-400">или</span>
              </div>
            </div>
            
            {/* Гостевой вход */}
            <button
              onClick={handleGuestLogin}
              className="w-full py-4 bg-white/10 text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all duration-200"
            >
              Continue as guest
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              World ID protects your privacy and shows you’re real.
            </p>
          </div>
        </div>
      </div>

      {/* Модальное окно World ID */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                World ID Verification
              </h3>
              
              <p className="text-gray-600 mb-6">
                {isLoading 
                  ? "Проверяем вашу уникальность..." 
                  : "Это демо-версия World ID. В реальном приложении здесь будет сканирование."}
              </p>
              
              {!isLoading && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={confirmWorldID}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Подтвердить
                  </button>
                </div>
              )}
              
              {isLoading && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}