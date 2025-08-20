const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем импорты после LastFmConnect
if (!content.includes('AppleMusicConnect')) {
  content = content.replace(
    "import LastFmConnect from '@/components/music-services/LastFmConnect';",
    `import LastFmConnect from '@/components/music-services/LastFmConnect';
import AppleMusicConnect from '@/src/components/music-services/AppleMusicConnect';
import CreatePartyButton from '@/components/CreatePartyButton';`
  );
}

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Added imports');
