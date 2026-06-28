# Online Library (Full-stack)

A NestJS + Prisma + PostgreSQL backend and a React (Vite) frontend for browsing Open Library books, managing a reading list, likes, and comments.

---

## Prerequisites

- Node.js 18 (see `.nvmrc`)
- Docker Desktop (for the local PostgreSQL container)

---

## Quick start

```bash
# 1. Install all workspace dependencies
npm install

# 2. Copy and fill in the backend environment file
cp backend/.env.example backend/.env
# Edit backend/.env — set JWT_SECRET to a long random string

# 3. Start everything (Docker DB + backend + frontend)
npm run dev
```

The frontend is served at **http://localhost:5173** (Vite may choose 5174/5175 if the port is busy — check the terminal output).  
The backend API is available at **http://localhost:3000**.  
Swagger UI (dev only): **http://localhost:3000/docs**

---

## Environment variables

### `backend/.env` (copy from `backend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret used to sign JWT access tokens — use a long random string |
| `PORT` | optional | HTTP port for the NestJS server (default: `3000`) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | optional | Set to `0` only if your local antivirus/proxy intercepts TLS (not for production) |

### `frontend/.env` (copy from `frontend/.env.example`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | optional | Backend base URL (default: `http://localhost:3000`) |

---

## Available scripts

From the workspace root:

| Command | Description |
|---|---|
| `npm run dev` | Start DB + backend + frontend concurrently |
| `npm run dev:backend` | Start only the NestJS backend in watch mode |
| `npm run dev:frontend` | Start only the Vite frontend |

From `backend/`:

| Command | Description |
|---|---|
| `npm run db:up` | Start the PostgreSQL Docker container |
| `npm run prisma:generate` | Regenerate the Prisma client after schema changes |
| `npm run prisma:migrate` | Run database migrations |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run lint` | Run ESLint with auto-fix |

---

## Project structure

```
library/
├── backend/          NestJS API
│   ├── src/
│   │   ├── auth/     JWT auth, guards, DTOs
│   │   ├── users/    Profile management
│   │   ├── library/  Books, likes, comments, reading list
│   │   └── config.ts Single source for all env-derived config
│   └── prisma/       Prisma schema and migrations
└── frontend/         React + Vite SPA
    └── src/
        ├── auth/     AuthContext (JWT stored in localStorage)
        ├── components/
        ├── layouts/
        └── pages/
```

---

## Tech stack

- **Backend**: NestJS, Prisma ORM, PostgreSQL, Passport JWT, class-validator, node-cache
- **Frontend**: React 18, React Router 6, Axios, Vite, TypeScript
- **External API**: [Open Library](https://openlibrary.org/developers/api) (books are not stored in the DB — only their OLIDs)
