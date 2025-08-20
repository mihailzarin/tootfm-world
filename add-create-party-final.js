const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем проверку сервисов
if (!content.includes('hasAnyService')) {
  // Добавляем проверку перед return
  content = content.replace(
    '  if (loading) {',
    `  // Check if any service is connected
  const hasAnyService = !!spotifyUser || !!lastfmUser || !!localStorage.getItem('apple_music_token');
  
  if (loading) {`
  );
}

// Добавляем кнопку Create Party после World ID
if (!content.includes('CreatePartyButton')) {
  content = content.replace(
    `{userData?.worldId ? \`World ID: \${userData.worldId.substring(0, 12)}...\` : 'Guest User'}
              </p>
            </div>`,
    `{userData?.worldId ? \`World ID: \${userData.worldId.substring(0, 12)}...\` : 'Guest User'}
              </p>
              {hasAnyService && (
                <div className="mt-4">
                  <CreatePartyButton hasServices={true} />
                </div>
              )}
            </div>`
  );
}

// Увеличиваем кнопку My Parties
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
console.log('✅ Added Create Party button and improved My Parties');
