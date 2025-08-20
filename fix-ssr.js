const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Исправляем строку с hasAnyService - убираем её оттуда
content = content.replace(
  "  const [lastfmUser, setLastfmUser] = useState<string | null>(null);\n  const hasAnyService = spotifyUser || lastfmUser || localStorage.getItem('apple_music_token');\n  const [activeTab, setActiveTab] = useState('services');",
  `  const [lastfmUser, setLastfmUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('services');`
);

// Добавляем hasAnyService внутри компонента после useEffect
content = content.replace(
  '  if (loading) {',
  `  // Check for connected services (client-side only)
  const hasAnyService = !!spotifyUser || !!lastfmUser || (typeof window !== 'undefined' && !!localStorage.getItem('apple_music_token'));
  
  if (loading) {'
);

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Fixed SSR issue');
