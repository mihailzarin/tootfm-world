# tootFM v2.0 - Revolutionary Party Playlists

🎵 **tootFM** - революционная веб-приложение для создания идеальных плейлистов на вечеринках, анализирующее музыкальные вкусы всех участников. Система автоматически генерирует плейлист, максимально подходящий всем, а World ID обеспечивает честное голосование (один человек = один голос).

## 🚀 Ключевые изменения v2.0

- **Google OAuth** вместо World ID для основной авторизации
- **World ID** только для голосования (опционально)
- **Фокус на анализе** и объединении данных из Spotify, Last.fm, Apple Music
- **Динамические плейлисты** с Party Radio режимом
- **Улучшенная архитектура** с Next.js 15.4 и TypeScript

## 🎯 Основные возможности

### 👤 Аутентификация и профиль
- Google OAuth для безопасного входа
- Профиль пользователя с аватаром и именем
- Опциональное подключение World ID для голосования

### 🎵 Подключение музыкальных сервисов
- **Spotify** - анализ top-artists, top-tracks, saved-tracks, saved-albums
- **Last.fm** - анализ LovedTracks, TopAlbums, TopArtists
- **Apple Music** - анализ heavy-rotation, recent-played
- **Единый музыкальный профиль** из всех источников

### 🎉 Вечеринки и плейлисты
- Создание вечеринок с уникальными кодами
- Приглашение друзей по коду
- **AI-генерация плейлистов** на основе вкусов всех участников
- **Демократическое голосование** с World ID
- **Party Radio режим** для динамической музыки
- Экспорт плейлистов в Spotify/Apple Music

## 🏗️ Технологический стек

### Frontend
- **Framework**: Next.js 15.4 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **State**: React Context + Hooks
- **Auth**: NextAuth.js с Google OAuth
- **UI**: Custom components + Lucide Icons

### Backend
- **Runtime**: Node.js 18+
- **API**: Next.js API Routes
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 6.14
- **Auth**: NextAuth + JWT
- **Cache**: Redis для музыкальных данных

### External Services
- **Auth Primary**: Google OAuth
- **Auth Secondary**: World ID (для голосования)
- **Music APIs**:
  - Spotify Web API
  - Last.fm API
  - Apple Music API (MusicKit JS)
- **Hosting**: Vercel
- **Database**: Supabase

## 🚀 Быстрый старт

### 1. Клонирование и установка

```bash
git clone <repository-url>
cd tootfm-app
npm install
```

### 2. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/tootfm"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Spotify API
SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
SPOTIFY_REDIRECT_URI="http://localhost:3000/api/auth/spotify/callback"

# Last.fm API
LASTFM_API_KEY="your-lastfm-api-key"
LASTFM_API_SECRET="your-lastfm-api-secret"

# Apple Music
APPLE_MUSIC_TEAM_ID="your-apple-team-id"
APPLE_MUSIC_KEY_ID="your-apple-key-id"
APPLE_MUSIC_PRIVATE_KEY="your-apple-private-key"

# World ID
WORLD_ID_APP_ID="app_staging_..."
WORLD_ID_ACTION="vote"

# Redis (для кэширования)
REDIS_URL="redis://localhost:6379"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Настройка базы данных

```bash
# Генерация Prisma клиента
npx prisma generate

# Применение миграций
npx prisma migrate dev

# (Опционально) Заполнение тестовыми данными
npx prisma db seed
```

### 4. Запуск приложения

```bash
# Режим разработки
npm run dev

# Сборка для продакшена
npm run build
npm start
```

## 🔧 Настройка API ключей

### Google OAuth
1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте `http://localhost:3000/api/auth/callback/google` в authorized redirect URIs

### Spotify API
1. Перейдите в [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Создайте новое приложение
3. Получите Client ID и Client Secret
4. Добавьте `http://localhost:3000/api/auth/spotify/callback` в Redirect URIs

### Last.fm API
1. Перейдите на [Last.fm API](https://www.last.fm/api)
2. Создайте аккаунт разработчика
3. Получите API Key и Secret

### Apple Music
1. Перейдите в [Apple Developer](https://developer.apple.com/)
2. Создайте MusicKit JS credentials
3. Получите Team ID, Key ID и Private Key

### World ID
1. Перейдите на [World ID](https://worldcoin.org/world-id)
2. Создайте приложение
3. Получите App ID

## 📱 Использование

### 1. Регистрация и вход
- Перейдите на главную страницу
- Нажмите "Get Started with Google"
- Авторизуйтесь через Google OAuth

### 2. Подключение музыкальных сервисов
- В профиле подключите Spotify, Last.fm, Apple Music
- Сгенерируйте единый музыкальный профиль

### 3. Создание вечеринки
- Нажмите "Create Party"
- Заполните название и описание
- Настройте функции (голосование, Party Radio)
- Получите уникальный код для приглашения

### 4. Присоединение к вечеринке
- Перейдите по ссылке `/join/[CODE]`
- Или введите код вручную
- Подключите свои музыкальные сервисы

### 5. Генерация плейлиста
- Нажмите "Generate Playlist"
- AI проанализирует вкусы всех участников
- Получите идеальный плейлист для вечеринки

### 6. Голосование и воспроизведение
- Голосуйте за треки (если включено World ID)
- Включите Party Radio для динамической музыки
- Экспортируйте плейлист в любимое приложение

## 🧬 Алгоритм объединения музыкальных профилей

### Дедупликация треков
- Нормализация названий и артистов
- Использование ISRC для точного сопоставления
- Взвешенное объединение из разных источников

### Анализ музыкальных вкусов
- Извлечение жанров из артистов
- Расчет энергетики и настроения
- Определение музыкальной личности

### Генерация плейлиста
- Анализ пересечений вкусов участников
- Расчет match score для каждого трека
- Оптимизация порядка воспроизведения

## 🔒 Безопасность

- **Google OAuth** для безопасной авторизации
- **World ID** для защиты от сибил-атак при голосовании
- **JWT токены** для сессий
- **Шифрование** токенов музыкальных сервисов
- **CORS** настройки для API

## 🚀 Деплой

### Vercel (рекомендуется)
```bash
npm install -g vercel
vercel
```

### Docker
```bash
docker build -t tootfm .
docker run -p 3000:3000 tootfm
```

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 🆘 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-username/tootfm/issues)
- **Discord**: [tootFM Community](https://discord.gg/tootfm)
- **Email**: support@tootfm.com

---

**tootFM** - Создавайте идеальные плейлисты вместе! 🎵✨
