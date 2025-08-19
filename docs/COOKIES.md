## Cookie contract

### Spotify
- spotify_token: string, httpOnly, 1h default
- spotify_refresh: string, httpOnly, ~1y
- spotify_expires: ISO string, client-readable
- spotify_user: JSON string, client-readable

### Last.fm
- lastfm_session: string, httpOnly
- lastfm_username: string, client-readable
- lastfm_user: JSON string, client-readable

### Identity
- world_id: string, httpOnly (Worldcoin)
- guest_id: string, client-readable (generated for guests)

### Defaults
- secure: true (production), sameSite: lax, path: /

See usages in:
- app/api/spotify/*
- app/api/music/lastfm/*
- app/api/party/*
- app/api/music/analyze/route.ts
## Cookie contract

### Spotify
- **spotify_token**: string, httpOnly, 1h default
- **spotify_refresh**: string, httpOnly, ~1y
- **spotify_expires**: ISO string, readable on client
- **spotify_user**: JSON stringified profile, client-readable

### Last.fm
- **lastfm_session**: string, httpOnly
- **lastfm_username**: string, client-readable
- **lastfm_user**: JSON stringified profile, client-readable

### Identity
- **world_id**: string, httpOnly (set after Worldcoin verification)
- **guest_id**: string, client-readable (created automatically for guests)

### Behavior
- Cookies are set with `secure: true` and `sameSite: 'lax'` in production code paths
- Paths default to `/`

See usages in:
- `app/api/spotify/*`
- `app/api/music/lastfm/*`
- `app/api/party/*`
- `app/api/music/analyze/route.ts`
