const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Находим блок с LastFmConnect и добавляем Apple Music после него
content = content.replace(
  `<LastFmConnect />
                )}
              </div>`,
  `<LastFmConnect />
                )}
                
                {/* Apple Music */}
                <div className="mt-4">
                  <AppleMusicConnect />
                </div>
              </div>`
);

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Added Apple Music to services section');
