'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Динамический импорт для World ID (клиентский компонент)
const WorldIDButton = dynamic(() => import('@/components/WorldIDButton'), {
  ssr: false,
  loading: () => (
    <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full opacity-50">
      Загрузка...
    </button>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900">
      {/* Паттерн на фоне */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10"></div>
      </div>
      
      {/* Контейнер с контентом */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        
        {/* Логотип и название */}
        <div className="text-center mb-8">
          <div className="mb-6 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
              <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full animate-bounce"></div>
            <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.3s'}}></div>
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-3">
            toot<span className="text-purple-400">FM</span>
          </h1>
          <p className="text-xl text-gray-300">
            Join tootFM. Play it here!
          </p>
        </div>

        {/* Описание */}
        <div className="max-w-md text-center mb-12">
          <p className="text-gray-400 leading-relaxed">
            Create shared playlists with friends in real-time. 
            Join tootFM. Play it here!
          </p>
        </div>

        {/* Кнопки действий с World ID */}
        <div className="flex flex-col gap-4 mb-8">
          {/* World ID кнопка */}
          <WorldIDButton />
          
          {/* Разделитель */}
          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-gray-600 flex-1"></div>
            <span className="text-gray-500 text-sm">или</span>
            <div className="h-px bg-gray-600 flex-1"></div>
          </div>
          
          {/* Обычные кнопки */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/create-session" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-full hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
              </svg>
              Start a Party 🎉
            </Link>
            
            <Link href="/join" className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-full border border-white/20 hover:bg-white/20 transform hover:scale-105 transition-all duration-200 flex items-center gap-2 justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
              Join
            </Link>
          </div>
        </div>

        {/* Карточки с фичами */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Connect Spotify</h3>
            <p className="text-gray-400 text-sm">Connect your Spotify and share your favorite tracks</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM13 13h2v2h-2zM15 15h2v2h-2zM13 17h2v2h-2zM17 17h2v2h-2zM19 19h2v2h-2zM15 19h2v2h-2zM17 13h2v2h-2zM19 15h2v2h-2z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">Join via QR</h3>
            <p className="text-gray-400 text-sm">Instant connection via QR code scanning</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/10 transition-all duration-200">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
              </svg>
            </div>
            <h3 className="text-white font-semibold mb-2">World ID</h3>
            <p className="text-gray-400 text-sm">Secure login with privacy protection</p>
          </div>
        </div>

        {/* Футер */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Powered by World MiniApps</p>
        </div>
      </div>
    </main>
  );
}