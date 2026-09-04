# Birustock Producer

Internal Producer/CMS application for Birustock. This repo is intentionally separated from the customer website repo.

## Stack
- TanStack Start + React + TypeScript
- Vite + Tailwind CSS
- Neon Postgres in production
- PGlite fallback in local development when `DATABASE_URL` is not set

## Environment
Set these in Vercel/local environment:

```env
DATABASE_URL=...
FOUNDER_PIN=...
FOUNDER_SESSION_SECRET=...
VITE_PUBLIC_SITE_URL=https://birustock.id
```

The current authentication is a protected PIN + signed session token. Replace it later with role-based user auth when the Producer team model is ready.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:8080/studio`.

Build:

```bash
npm run typecheck
npm run build
```

`npm run build` applies pending migrations when `DATABASE_URL` is available.

## Intended deployment
- Customer app: `birustockidv2`
- Producer app: this repo
- Shared data source: same Neon Postgres database
- Suggested Producer domain: `producer.birustock.id`
