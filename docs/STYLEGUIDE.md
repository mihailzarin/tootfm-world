## Code style guide

### TypeScript
- Explicit types for public exports and function signatures
- Avoid `any`; model shapes with interfaces/types
- Use early returns and guard clauses to reduce nesting

### React
- Functional components; prefer composition over props drilling
- Keep components focused; extract hooks for shared logic
- Co-locate styles and tests with components when practical

### Naming
- Descriptive, full-word names (avoid abbreviations)
- Functions: verbs; variables: nouns

### Errors and logging
- Return structured errors `{ error: string }` with HTTP status codes
- Use readable log markers; avoid logging secrets

### Formatting
- Match existing formatting; keep lines readable
