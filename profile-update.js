const fs = require('fs');

// Читаем файл
let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем импорт CreatePartyButton
if (!content.includes('CreatePartyButton')) {
  content = content.replace(
    "import LastFmConnect from '@/components/music-services/LastFmConnect';",
    `import LastFmConnect from '@/components/music-services/LastFmConnect';
import CreatePartyButton from '@/components/CreatePartyButton';
import AppleMusicConnect from '@/src/components/music-services/AppleMusicConnect';`
  );
}

// Добавляем проверку подключенных сервисов
if (!content.includes('hasAnyService')) {
  content = content.replace(
    'const [activeTab, setActiveTab] = useState',
    `const hasAnyService = spotifyConnected || lastfmConnected || localStorage.getItem('apple_music_token');
  const [activeTab, setActiveTab] = useState`
  );
}

// Добавляем кнопку после заголовка профиля
if (!content.includes('CreatePartyButton')) {
  content = content.replace(
    '</h1>\n            <p className="text-gray-400">',
    `</h1>
            <div className="mt-4">
              <CreatePartyButton hasServices={!!hasAnyService} />
            </div>
            <p className="text-gray-400">`
  );
}

// Записываем обратно
fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Updated profile with Create Party button');
