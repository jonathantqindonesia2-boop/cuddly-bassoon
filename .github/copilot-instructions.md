# Workspace instructions for cuddly-bassoon

## Project overview

This is a small Next.js App Router application for a grocery store manager dashboard. It is built with:
- `next` App Router
- TypeScript
- Tailwind CSS
- Prisma + SQLite
- `app/` routes and API route handlers
- reusable UI components in `components/`

The app includes admin/kasir login, product management, sales transactions, and daily reports.

## Primary workflow

Use these commands when working in the repo:

- `npm install` – install dependencies
- `npm run setup` – push Prisma schema to SQLite and seed demo data
- `npm run dev` – start the development server
- `npm run build` – run Prisma generate and build Next.js
- `npm run lint` – run Next.js ESLint
- `npm run prisma:push` – push schema changes to the database
- `npm run seed` – run `prisma/seed.ts`

If the user asks to update the database schema or seed data, prefer editing `prisma/schema.prisma` and `prisma/seed.ts` rather than modifying generated files.

## Key locations

- `app/` – App Router pages and route handlers
- `app/api/` – backend API routes for products, transactions, reports
- `app/login/page.tsx` – login screen
- `components/` – reusable UI and authentication helpers
- `components/AuthProvider.tsx` – auth context provider
- `components/RequireAuth.tsx` – route protection wrapper
- `lib/prisma.ts` – Prisma client setup
- `prisma/schema.prisma` – database schema
- `prisma/seed.ts` – demo data seeding script

## Recommended guidance for Copilot

- Keep UI and page logic in `app/`.
- Keep reusable code in `components/`.
- Prefer server components by default; only use `"use client"` in files that need browser state or effects.
- Do not edit anything under `.next/`.
- Preserve the existing auth and routing behavior unless the user explicitly wants to change it.

## When to ask for clarification

- If a feature request is unclear about whether it is admin-only or cashier-facing.
- If the user asks for behavior changes involving authentication, session flow, or redirects.
- If a data model change would affect multiple APIs, confirm the desired schema and UI impact.

## Related docs

Refer to `README.md` for setup and app overview.