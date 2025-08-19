## Contributing

### Workflow
1) Fork and create a feature branch
2) Create a minimal, focused change with tests where applicable
3) Run locally and ensure `node verify-deployment.js` passes
4) Submit a PR with a concise description and screenshots for UI changes

### Coding style
- TypeScript strict mode is enabled; prefer explicit types on exports
- Follow code readability guidelines in `docs/STYLEGUIDE.md`
- Keep functions small and purposeful; add guard clauses for edge cases

### Commit messages
- Use conventional style when possible, e.g., `feat:`, `fix:`, `docs:`
