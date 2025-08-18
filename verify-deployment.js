#!/usr/bin/env node
// verify-deployment.js
// Скрипт для автоматической проверки всех критических изменений перед деплоем
// Запуск: node verify-deployment.js

const fs = require('fs');
const path = require('path');

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Результаты проверок
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let warnings = [];

// Функция для вывода результата проверки
function checkResult(testName, passed, details = '') {
  totalChecks++;
  if (passed) {
    passedChecks++;
    console.log(`${colors.green}✅ ${testName}${colors.reset}`);
    if (details) console.log(`   ${colors.cyan}${details}${colors.reset}`);
  } else {
    failedChecks++;
    console.log(`${colors.red}❌ ${testName}${colors.reset}`);
    if (details) console.log(`   ${colors.yellow}${details}${colors.reset}`);
  }
}

// Функция для чтения файла
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    return null;
  }
}

// Главная функция проверки
function verifyDeployment() {
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}         tootFM - Pre-Deployment Verification Script          ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);

  // 1. ПРОВЕРКА LAST.FM CALLBACK
  console.log(`${colors.cyan}📁 Checking: app/api/music/lastfm/callback/route.ts${colors.reset}`);
  const lastfmCallbackPath = path.join(process.cwd(), 'app/api/music/lastfm/callback/route.ts');
  const lastfmCallback = readFile(lastfmCallbackPath);
  
  if (lastfmCallback) {
    // Проверка cookies
    checkResult(
      'Last.fm saves lastfm_session cookie',
      lastfmCallback.includes("response.cookies.set('lastfm_session'"),
      'Session key for API requests'
    );
    
    checkResult(
      'Last.fm saves lastfm_username cookie',
      lastfmCallback.includes("response.cookies.set('lastfm_username'"),
      'Username for UI display'
    );
    
    checkResult(
      'Last.fm saves lastfm_user cookie',
      lastfmCallback.includes("response.cookies.set('lastfm_user'"),
      'Full user data object'
    );
    
    // Проверка URL
    checkResult(
      'Uses correct base URL',
      lastfmCallback.includes("'https://tootfm.world'") || lastfmCallback.includes('NEXT_PUBLIC_APP_URL'),
      'Production URL configured'
    );
    
    // Проверка редиректа
    checkResult(
      'Redirects to profile with correct params',
      lastfmCallback.includes('/profile?lastfm=connected'),
      'Success redirect configured'
    );
  } else {
    checkResult('Last.fm callback file exists', false, 'File not found!');
  }
  
  console.log('');
  
  // 2. ПРОВЕРКА MUSIC ANALYZE
  console.log(`${colors.cyan}📁 Checking: app/api/music/analyze/route.ts${colors.reset}`);
  const analyzePath = path.join(process.cwd(), 'app/api/music/analyze/route.ts');
  const analyzeFile = readFile(analyzePath);
  
  if (analyzeFile) {
    // Проверка чтения cookies
    checkResult(
      'Reads Spotify token from cookies',
      analyzeFile.includes("cookies.get('spotify_token')"),
      'Spotify integration check'
    );
    
    checkResult(
      'Reads Last.fm username from cookies',
      analyzeFile.includes("cookies.get('lastfm_username')"),
      'Last.fm integration check'
    );
    
    // Проверка API вызовов
    checkResult(
      'Fetches Spotify data',
      analyzeFile.includes('api.spotify.com/v1/me/top'),
      'Spotify API calls present'
    );
    
    checkResult(
      'Fetches Last.fm data',
      analyzeFile.includes('ws.audioscrobbler.com/2.0/'),
      'Last.fm API calls present'
    );
    
    // Проверка объединения данных
    checkResult(
      'Combines data from both services',
      analyzeFile.includes('allTracks') && analyzeFile.includes('allArtists'),
      'Data aggregation logic'
    );
    
    // Проверка sources
    checkResult(
      'Returns sources in response',
      analyzeFile.includes('sources') && analyzeFile.includes("sources.push"),
      'Source tracking implemented'
    );
    
    // Проверка fallback
    checkResult(
      'Has demo data fallback',
      analyzeFile.includes('getDemoProfile') || analyzeFile.includes('demo'),
      'Error handling present'
    );
  } else {
    checkResult('Music analyze file exists', false, 'File not found!');
  }
  
  console.log('');
  
  // 3. ПРОВЕРКА LASTFM CONNECT COMPONENT
  console.log(`${colors.cyan}📁 Checking: components/music-services/LastFmConnect.tsx${colors.reset}`);
  const lastfmConnectPath = path.join(process.cwd(), 'components/music-services/LastFmConnect.tsx');
  const lastfmConnect = readFile(lastfmConnectPath);
  
  if (lastfmConnect) {
    // Проверка чтения cookies
    checkResult(
      'Reads lastfm_username cookie',
      lastfmConnect.includes("startsWith('lastfm_username=')"),
      'Username cookie check'
    );
    
    checkResult(
      'Reads lastfm_user cookie (fallback)',
      lastfmConnect.includes("startsWith('lastfm_user=')"),
      'User data cookie check'
    );
    
    // Проверка подключения
    checkResult(
      'Correct redirect to auth endpoint',
      lastfmConnect.includes("'/api/lastfm/auth'") || lastfmConnect.includes("'/api/music/lastfm/auth'"),
      'Auth flow configured'
    );
    
    // Проверка UI
    checkResult(
      'Shows username when connected',
      lastfmConnect.includes('{username}') || lastfmConnect.includes('username'),
      'Username display logic'
    );
  } else {
    checkResult('LastFmConnect component exists', false, 'File not found!');
  }
  
  console.log('');
  
  // 4. ПРОВЕРКА MUSIC PORTRAIT
  console.log(`${colors.cyan}📁 Checking: components/profile/MusicPortrait.tsx${colors.reset}`);
  const portraitPath = path.join(process.cwd(), 'components/profile/MusicPortrait.tsx');
  const portrait = readFile(portraitPath);
  
  if (portrait) {
    // Проверка sources
    checkResult(
      'Displays data sources',
      portrait.includes('profile.sources') && portrait.includes('Данные из:'),
      'Source display implemented'
    );
    
    // Проверка localStorage
    checkResult(
      'Uses localStorage for caching',
      portrait.includes('localStorage.setItem') && portrait.includes('music_profile'),
      'Profile caching enabled'
    );
    
    // Проверка кнопки обновления
    checkResult(
      'Has refresh button',
      portrait.includes('RefreshCw') || portrait.includes('analyzeMusic'),
      'Manual refresh available'
    );
    
    // Проверка обработки ошибок
    checkResult(
      'Has error handling',
      portrait.includes('error') && portrait.includes('setError'),
      'Error states handled'
    );
    
    // Проверка API вызова
    checkResult(
      'Calls /api/music/analyze',
      portrait.includes("'/api/music/analyze'"),
      'API endpoint configured'
    );
  } else {
    checkResult('MusicPortrait component exists', false, 'File not found!');
  }
  
  console.log('');
  
  // 5. ДОПОЛНИТЕЛЬНЫЕ ПРОВЕРКИ
  console.log(`${colors.cyan}🔧 Additional Checks:${colors.reset}`);
  
  // Проверка package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = readFile(packageJsonPath);
  if (packageJson) {
    const pkg = JSON.parse(packageJson);
    checkResult(
      'Package.json is valid',
      true,
      `Version: ${pkg.version}`
    );
  }
  
  // Проверка .env.local (если есть)
  const envPath = path.join(process.cwd(), '.env.local');
  const envFile = readFile(envPath);
  if (envFile) {
    checkResult(
      'Has LASTFM_API_KEY',
      envFile.includes('LASTFM_API_KEY'),
      'Last.fm API key configured'
    );
    
    checkResult(
      'Has LASTFM_API_SECRET',
      envFile.includes('LASTFM_API_SECRET'),
      'Last.fm secret configured'
    );
  } else {
    warnings.push('No .env.local file found (OK if using Vercel env vars)');
  }
  
  // ФИНАЛЬНЫЙ ОТЧЕТ
  console.log(`\n${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}                        VERIFICATION RESULTS                   ${colors.reset}`);
  console.log(`${colors.blue}═══════════════════════════════════════════════════════════════${colors.reset}\n`);
  
  console.log(`Total checks: ${totalChecks}`);
  console.log(`${colors.green}Passed: ${passedChecks}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failedChecks}${colors.reset}`);
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
    warnings.forEach(w => console.log(`   ${colors.yellow}- ${w}${colors.reset}`));
  }
  
  if (failedChecks === 0) {
    console.log(`\n${colors.green}✅ ALL CHECKS PASSED! Ready to deploy! 🚀${colors.reset}\n`);
    console.log('Run these commands to deploy:');
    console.log(`${colors.cyan}  git add .${colors.reset}`);
    console.log(`${colors.cyan}  git commit -m "Fix Last.fm integration and Music Portrait"${colors.reset}`);
    console.log(`${colors.cyan}  git push origin main${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ VERIFICATION FAILED! Please fix the issues above.${colors.reset}\n`);
    console.log('Critical issues found:');
    console.log(`${colors.yellow}- Check that all required code changes are implemented${colors.reset}`);
    console.log(`${colors.yellow}- Make sure file paths are correct${colors.reset}`);
    console.log(`${colors.yellow}- Verify that you saved all files in VS Code${colors.reset}\n`);
    process.exit(1);
  }
}

// Запуск проверки
try {
  verifyDeployment();
} catch (error) {
  console.error(`${colors.red}Error running verification:${colors.reset}`, error);
  process.exit(1);
}

