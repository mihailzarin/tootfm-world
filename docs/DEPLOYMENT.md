## Deployment

### Vercel
1) Set environment variables in Vercel Project Settings:
   - `NEXT_PUBLIC_APP_URL` = your production URL (e.g., https://tootfm.world)
   - `DATABASE_URL` (Vercel Postgres or external)
   - `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`
   - `LASTFM_API_KEY`, `LASTFM_API_SECRET`
   - `NEXT_PUBLIC_WORLD_APP_ID`, `NEXT_PUBLIC_WORLD_ACTION_ID`
   - Optional Apple vars if needed
2) Connect repo and deploy. Prisma generates on build via `postinstall`/`build`.

### Build
```bash
npm run build
```
Note: `next.config.js` ignores ESLint and TS errors during builds by design. Tighten in production if desired.

### Post-deploy checks
```bash
node verify-deployment.js
```
Verify health:
```bash
curl -s https://your-domain/api/health | jq
```

### Database migrations
Run migrations during CI/CD or with a one-off job:
```bash
npx prisma migrate deploy
```
