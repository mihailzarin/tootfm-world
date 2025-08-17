"use client";

export default function SpotifyConnect() {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Spotify Connect</h2>
      <p className="text-gray-300 mb-4">
        Подключите Spotify для воспроизведения музыки
      </p>
      <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-full transition-all">
        Подключить Spotify
      </button>
    </div>
  );
}
