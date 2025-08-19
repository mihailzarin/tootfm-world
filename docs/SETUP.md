## Local setup

### Prerequisites
- **Node.js** 20+
- **PostgreSQL** 14+

### 1) Environment
Copy and fill envs:
```bash
cp .env.example .env.local
```

### 2) Dependencies
```bash
npm install
```

### 3) Database
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4) Run
```bash
npm run dev
```
App runs at http://localhost:3000

### Optional: separate socket server
`socket.io` is included. If you add a server at `src/server/socket.js`, you can run:
```bash
npm run socket:dev
```

### Useful commands
- **Prisma Studio**:
```bash
npx prisma studio
```
- **Type checking**:
```bash
npx tsc --noEmit
```
