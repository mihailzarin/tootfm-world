const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Заменяем секцию с кнопками на улучшенную версию
content = content.replace(
  `<button
              onClick={() => router.push('/my-parties')}
              className="text-gray-300 hover:text-white transition"
            >
              My Parties
            </button>`,
  `<button
              onClick={() => router.push('/my-parties')}
              className="bg-purple-600/20 hover:bg-purple-600/30 text-white font-medium py-2 px-6 rounded-lg transition"
            >
              My Parties
            </button>`
);

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Fixed My Parties button style');
