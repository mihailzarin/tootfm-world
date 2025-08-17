'use client';

interface YouTubePlayerProps {
  videoId: string;
  onEnd?: () => void;
  autoplay?: boolean;
}

export default function YouTubePlayer({ videoId, onEnd, autoplay = false }: YouTubePlayerProps) {
  return (
    <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
      <img 
        src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
        alt="Video"
        className="w-full h-full object-cover"
      />
      <button 
        onClick={() => window.open(`https://youtube.com/watch?v=${videoId}`, '_blank')}
        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white hover:bg-black/40"
      >
        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
    </div>
  );
}
