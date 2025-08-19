## Troubleshooting

### Spotify auth redirects to wrong URL
- Ensure NEXT_PUBLIC_APP_URL matches your current environment
- Consider refactoring app/api/spotify/auth/route.ts to read envs instead of hardcoding

### 401 Spotify token expired
- Ensure spotify_refresh cookie is present
- Reconnect Spotify via Profile → Services if refresh fails

### Last.fm missing API key/secret
- Verify LASTFM_API_KEY and LASTFM_API_SECRET envs
- Hit /api/health to confirm configuration

### Database connection errors
- Check DATABASE_URL format and reachability
- Run: `npx prisma migrate dev` locally to initialize schema

### Cookies not persisting locally
- Use http://localhost and avoid third‑party cookie blocking
- Cookies are set on path '/'

### TypeScript errors during dev
- Build ignores TS errors (next.config). Run `npx tsc --noEmit` and fix

### Mixed content/CORS issues
- Ensure HTTPS in production
- Ensure NEXT_PUBLIC_APP_URL uses https:// and correct domain
