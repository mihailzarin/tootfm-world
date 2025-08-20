const fs = require('fs');

let content = fs.readFileSync('app/profile/page.tsx', 'utf8');

// Добавляем hasAnyService после setLoading(false) перед if (loading)
content = content.replace(
  '    setLoading(false);\n  }, []);\n\n  if (loading) {',
  `    setLoading(false);
  }, []);

  // Check for connected services (client-side only)
  const hasAnyService = !!spotifyUser || !!lastfmUser || (typeof window !== 'undefined' && !!localStorage.getItem('apple_music_token'));

  if (loading) {`
);

fs.writeFileSync('app/profile/page.tsx', content);
console.log('✅ Fixed SSR issue');
