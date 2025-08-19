## Scripts

### verify-deployment.js
Usage:
```bash
node verify-deployment.js
```
Performs pre-deploy checks:
- Confirms Last.fm callback sets cookies and redirects
- Confirms music analyze endpoint reads cookies and calls external APIs
- Validates UI components related to Last.fm and profile
- Warns if .env.local missing

Exit status:
- 0 when all checks pass
- 1 when any check fails
