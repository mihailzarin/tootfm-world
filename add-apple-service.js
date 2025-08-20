const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Находим конец Last.fm блока и добавляем Apple Music
const lastfmBlockEnd = `</div>
            </div>
          )}`;

if (!content.includes('AppleMusicConnect />') && content.includes(lastfmBlockEnd)) {
  content = content.replace(
    lastfmBlockEnd,
    `</div>

              {/* Apple Music */}
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">Apple Music</h3>
                </div>
                <AppleMusicConnect />
              </div>
            </div>
          )}`
  );
}

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Added Apple Music to services');
