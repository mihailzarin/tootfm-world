## REST API

All endpoints are under Next.js App Router in `app/api/*`. Responses are JSON unless redirected.

### Health
- **GET** `/api/health`
  - **200** `{ status: 'ok', checks: { spotify, worldId, ... } }`

### Spotify
- **GET** `/api/spotify/auth`
  - Redirects to Spotify authorization page
  - Note: current implementation contains hardcoded client/redirect in code. For production, ensure it reads envs.

- **GET** `/api/spotify/callback`
  - Exchanges `code` for tokens
  - Sets cookies: `spotify_token` (httpOnly), `spotify_refresh` (httpOnly), `spotify_expires`, `spotify_user`
  - Redirects to `/profile?spotify=connected&tab=services`

- **POST** `/api/spotify/refresh`
  - Requires `spotify_refresh` cookie
  - Refreshes access token and updates `spotify_token` and `spotify_expires`

- **POST** `/api/spotify/search`
  - Body: `{ "query": string }`
  - Requires `spotify_token` cookie; attempts refresh on 401
  - Returns `{ tracks: [], total, next? }`

### Last.fm
- **GET** `/api/music/lastfm/auth`
  - Starts Last.fm auth; uses `LASTFM_API_KEY` and `NEXT_PUBLIC_APP_URL`

- **GET** `/api/music/lastfm/callback`
  - Finalizes Last.fm auth
  - Sets cookies: `lastfm_session`, `lastfm_username`, `lastfm_user`
  - Redirects to `/profile?lastfm=connected`

- **GET** `/api/music/lastfm/top-tracks`
  - Uses `lastfm_username` cookie and `LASTFM_API_KEY`
  - Returns recent tracks as a top-tracks proxy

### Parties
- **POST** `/api/party/create`
  - Body: `{ name: string, description?: string, userId?: string, worldId?: string }`
  - Creates party with unique 6-char `code`; auto-creates user if needed
  - Returns `{ success, party }`

- **GET** `/api/party/[code]`
  - Returns party details, members, tracks, and counts
  - 404 if missing; 410 if ended

- **GET** `/api/party/[code]/tracks`
  - Returns `{ success, tracks }` sorted by `voteCount`

- **POST** `/api/party/[code]/tracks`
  - Body: `{ spotifyId, name, artist, album?, albumArt?, duration? }`
  - Identifies user via `world_id` or `guest_id` cookies; creates guest if absent
  - Adds track to party; returns `{ success, track }`

- **POST** `/api/party/[code]/generate-playlist`
  - Generates a demo smart playlist and persists tracks
  - Returns `{ success, playlist, stats }`

### Music analysis
- **POST** `/api/music/analyze`
  - Aggregates Spotify and Last.fm data for the authenticated user (via cookies)
  - Returns cross-service profile and sources metadata

### Apple Music
- **GET** `/api/music/apple/test`
  - Verifies presence of Apple credentials and token generation

### Auth and cookies
- See `docs/COOKIES.md` for cookie contract and lifetimes.
