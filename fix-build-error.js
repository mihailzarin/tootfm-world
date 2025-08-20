const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Находим строку с hasAnyService и исправляем
content = content.replace(
  'const hasAnyService = !!spotifyUser || !!lastfmUser || !!localStorage.getItem(\'apple_music_token\');',
  'const hasAnyService = !!spotifyUser || !!lastfmUser || (typeof window !== \'undefined\' && !!localStorage.getItem(\'apple_music_token\'));'
);

// Если эта переменная используется где-то ещё, заменяем на spotifyUser
content = content.replace(/spotifyConnected/g, 'spotifyUser');
content = content.replace(/lastfmConnected/g, 'lastfmUser');

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Fixed build error');
