const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем переменную hasAnyService перед return
if (!content.includes('hasAnyService')) {
  content = content.replace(
    '  if (loading) {',
    `  const hasAnyService = spotifyConnected || lastfmConnected;
  
  if (loading) {`
  );
}

// Добавляем кнопку Create Party после заголовка профиля
if (!content.includes('Create Party')) {
  content = content.replace(
    `<p className="text-gray-400">
              World ID: {userData?.worldId?.slice(0, 14)}...
            </p>`,
    `<p className="text-gray-400">
              World ID: {userData?.worldId?.slice(0, 14)}...
            </p>
            
            {/* Create Party Button */}
            {hasAnyService && (
              <div className="mt-6">
                <CreatePartyButton hasServices={hasAnyService} />
              </div>
            )}
            {!hasAnyService && (
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  Connect a music service below to create parties
                </p>
              </div>
            )}`
  );
}

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Added Create Party button to profile');
