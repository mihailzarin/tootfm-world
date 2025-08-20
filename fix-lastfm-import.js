const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем импорт LastFmConnect если его нет
if (!content.includes("import LastFmConnect")) {
  content = content.replace(
    "import SpotifyConnect from '@/components/SpotifyConnect';",
    `import SpotifyConnect from '@/components/SpotifyConnect';
import LastFmConnect from '@/components/music-services/LastFmConnect';`
  );
}

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Fixed Last.fm import');
