## tootFM World

Social music parties powered by taste graphs. Create a party, invite friends, connect music services, and build a smart crowd-sourced playlist.

### Tech stack
- **Framework**: Next.js 15 (App Router) + React 19
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL via Prisma
- **APIs**: Spotify OAuth, Last.fm, Apple Music (JWT helper in codebase)
- **Real-time**: socket.io (dependency present; server optional)

### Quick start
1) Copy envs and fill values:
```bash
cp .env.example .env.local
```
2) Install deps and set up DB:
```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
```
3) Run the app:
```bash
npm run dev
```
Open http://localhost:3000

### Key features
- **Parties**: create/join via short codes; add and vote tracks
- **Smart playlist**: auto-generate a starter playlist for the room
- **Music services**: connect Spotify, Last.fm; Apple Music JWT helper available
- **Profiles**: per-user music profile model for future taste analysis

### Docs
- See `docs/SETUP.md` for local setup
- See `docs/ENVIRONMENT.md` and `.env.example` for all required env vars
- See `docs/API.md` for REST endpoints
- See `docs/ARCHITECTURE.md` and `docs/DATABASE.md` for internals
- See `docs/DEPLOYMENT.md` to deploy (Vercel-friendly)
- See `docs/TROUBLESHOOTING.md` for common fixes

### Repository layout (high-level)
- `app/` Next.js routes and API handlers
- `components/` UI components (party, music-services, profile)
- `lib/` Prisma client and service adapters
- `prisma/` schema and migrations
- `docs/` full project documentation

### License
MIT or as specified by the repository owner.
