const fs = require('fs');

// Читаем файл
let content = fs.readFileSync('components/profile/MusicPortrait.tsx', 'utf8');

// Заменяем проблемную строку
content = content.replace(
  '{track.artist}',
  '{typeof track.artist === "string" ? track.artist : (track.artist?.name || track.artist?.["#text"] || "Unknown Artist")}'
);

// Записываем обратно
fs.writeFileSync('components/profile/MusicPortrait.tsx', content);
console.log('✅ Fixed MusicPortrait.tsx');
