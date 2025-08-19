## Architecture

### Overview
- **Next.js 15** App Router for pages and API routes in `app/`
- **React 19** components in `components/` and `app/*`
- **Prisma** data layer with PostgreSQL (`prisma/schema.prisma`)
- **Music services** adapters in `lib/music-services/*`

### Modules
- **Parties**
  - Users create/join parties via short `code`
  - Tracks are added to party; votes tracked per user/track
  - Smart playlist generator seeds playlist based on common taste (demo version in code)

- **Auth and identity**
  - Worldcoin widget (`components/WorldIDButton.tsx`) provides a `world_id` cookie when verified
  - Guests are assigned `guest_...` IDs; persisted via `guest_id` cookie

- **Service connections**
  - Spotify OAuth: cookies `spotify_token`, `spotify_refresh`, `spotify_expires`, `spotify_user`
  - Last.fm: cookies `lastfm_session`, `lastfm_username`, `lastfm_user`
  - Apple Music: developer token helper present in `src/lib/music-services/apple/token-generator.ts`

### Data model (highlights)
- `User`: `worldId`-keyed identity (guest or verified)
- `Party`: creator, `code`, `isActive`
- `PartyMember`: user membership and role
- `Track`: deduped by `(spotifyId, partyId)`, `voteCount`
- `Vote`: per-user votes for tracks
- `MusicService`: per-user tokens and sync params
- `MusicProfile`: aggregate taste vectors and stats
- `SyncHistory`: log of sync runs per service

### Request flow examples
- Spotify search
  1) Client calls `POST /api/spotify/search` with `{ query }`
  2) Server reads `spotify_token` cookie; refreshes via `/api/spotify/refresh` if expired
  3) Proxies to Spotify search; returns track list

- Add track to party
  1) Client posts to `/api/party/[code]/tracks`
  2) Server determines user via `world_id` or `guest_id` cookie (creates guest if missing)
  3) Persists track; returns augmented track payload

### Error handling
- Consistent JSON error shape `{ error: string }` with appropriate HTTP status codes
- Log markers: emojis in server logs for quick scanning during debugging

### Future evolution
- Replace demo playlist generator with taste-intersection scoring from `MusicProfile`
- Real-time updates via socket.io rooms per party code
- Central session/auth layer and CSRF protection where needed
