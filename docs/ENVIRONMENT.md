## Environment variables

### Core
- **NODE_ENV**: `development` | `production`
- **NEXT_PUBLIC_APP_URL**: Base URL used by callbacks and server-to-server calls
- **DATABASE_URL**: PostgreSQL connection string

### Spotify
- **SPOTIFY_CLIENT_ID**: OAuth client id
- **SPOTIFY_CLIENT_SECRET**: OAuth client secret
- Optional: **SPOTIFY_REDIRECT_URI** (derived from app URL in code)

### Last.fm
- **LASTFM_API_KEY**: API key
- **LASTFM_API_SECRET**: API secret
- Optional: **LASTFM_CALLBACK_URL**: Override callback URL

### Worldcoin
- **NEXT_PUBLIC_WORLD_APP_ID**: Public app id for the client widget
- **NEXT_PUBLIC_WORLD_ACTION_ID**: Public action id (e.g., `verify`)

### Apple Music (developer token)
- **APPLE_TEAM_ID**: Apple developer team id
- **APPLE_KEY_ID**: Key id
- **APPLE_PRIVATE_KEY**: PEM private key (newlines escaped as `\n` if stored inline)

### Optional misc
- **SOCKET_PORT**: Port for a custom socket server if used

See `.env.example` for a ready-to-copy template.
