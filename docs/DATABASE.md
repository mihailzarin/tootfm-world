## Database

PostgreSQL via Prisma. Connection string in `DATABASE_URL`.

### Models (summary)
- `User`
  - `worldId` unique identifier (Worldcoin or guest)
  - Relations: `musicProfile`, `musicServices`, `createdParties`, `joinedParties`, `addedTracks`, `votes`, `syncHistory`

- `Party`
  - `code` unique 6-char code, `isActive`
  - Relations: `creator`, `members`, `tracks`

- `PartyMember`
  - Unique by `(userId, partyId)`; role: `host`|`member`

- `Track`
  - Unique by `(spotifyId, partyId)`; `voteCount` materialized for fast ordering

- `Vote`
  - Unique by `(userId, trackId)`; `value` int (e.g., +1/-1)

- `MusicService`
  - One per `(userId, service)`; stores tokens, expiries, sync controls

- `MusicProfile`
  - Per-user aggregate taste: top entities and vectors for future scoring

- `SyncHistory`
  - Audit log of sync runs: counts, durations, statuses

### Migrations
Use Prisma migrations:
```bash
npx prisma migrate dev --name <name>
```

Open Prisma Studio to inspect data:
```bash
npx prisma studio
```
