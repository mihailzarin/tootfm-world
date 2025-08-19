## Security notes

- Prefer env-driven configuration for OAuth credentials; remove hardcoded secrets from source
- Store access tokens in httpOnly cookies; keep lifetimes minimal
- Use sameSite=lax and secure cookies in production
- Validate and sanitize all inputs to API routes
- Principle of least privilege for database roles
- Rotate Spotify/Last.fm credentials periodically
- Avoid logging sensitive tokens; current logs print masked client id
