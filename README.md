# Online Library (Full-stack)

This workspace contains a NestJS backend with Prisma + Postgres and a React (Vite) frontend.

Quick run (recommended):

1. Install dependencies from the workspace root:
   - npm install
2. Start everything with one command:
   - npm run dev

Separate commands if you want only one component:

1. Backend only:
   - cd backend
   - npm run start:dev
2. Frontend only:
   - cd frontend
   - npm run dev

Root commands:
- npm run dev:backend
- npm run dev:frontend

What `npm run dev` does:

1. Starts Postgres with `docker compose up -d` from the backend workspace
2. Starts the NestJS backend
3. Starts the React frontend

Database setup, if you want to run pieces manually:

1. Start Postgres (from backend folder):
   - cd backend
   - docker-compose up -d
2. Set env (copy .env.example to .env and edit JWT_SECRET)
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`

The frontend uses Open Library public API for searching books; backend provides auth, comments, likes and reading-list persistence.
