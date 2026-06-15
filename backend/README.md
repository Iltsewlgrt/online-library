# Online Library — Backend

Postgres + NestJS + Prisma

Environment:
- Set `DATABASE_URL` (example: `postgresql://postgres:postgres@localhost:5432/onlinelib`)

Quick start:
1. Start Postgres: `docker-compose up -d`
2. Install deps: `npm install`
3. Generate Prisma client: `npm run prisma:generate`
4. Run migrations: `npm run prisma:migrate`
5. Start dev server: `npm run start:dev`
