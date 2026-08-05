<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS v4 (not v3)
- Prisma with MySQL (`DATABASE_URL` in `.env`)
- NextAuth v5 beta (customer auth) + separate custom JWT for admin (`lib/admin-jwt.ts`, `lib/admin-cookie.ts`)
- Razorpay payments, Cloudinary image uploads
- shadcn/ui with `radix-nova` style (not default) — see `components.json`
- React Compiler enabled via `babel-plugin-react-compiler`

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # eslint (next core-web-vitals + typescript configs)
```

There is **no typecheck or test script**. Type-checking relies on `noEmit` in `tsconfig.json`. If you need to validate types manually: `npx tsc --noEmit`.

## Database

- Schema: `prisma/schema.prisma`
- Engine: `classic` (set in `prisma.config.ts`)
- Seed: `npx tsx prisma/seed.ts`
- After schema changes: `npx prisma migrate dev --name <description>`
- `prisma.config.ts` loads `.env` via `dotenv/config`

## Auth

Two separate auth systems — they are **not interchangeable**:

- **Customer**: NextAuth v5 in `lib/auth.ts`. Session is JWT-based. Used via `auth()` wrapper in `middleware.ts` for `/admin` route protection.
- **Admin**: Custom JWT in `lib/admin-jwt.ts` + cookie in `lib/admin-cookie.ts`. Login logic in `lib/admin-auth.ts`. Admin API routes read the admin JWT directly, not through NextAuth.

## Architecture

- `app/` — customer-facing pages (products, cart, checkout, account, etc.)
- `app/admin/(dashboard)/` — admin dashboard (route group; layout at `app/admin/(dashboard)/layout.tsx`)
- `app/admin/login/page.tsx` — admin login (separate from customer auth)
- `app/api/` — REST API routes organized by domain (`api/admin/`, `api/payment/`, `api/cart/`, etc.)
- `lib/` — shared utilities, prisma client, auth, validations, payment helpers
- `components/` — React components (shadcn UI in `components/ui/`)
- `types/` — TypeScript type definitions including custom `.d.ts` files

Path alias: `@/*` maps to project root.

## Gotchas

- `next.config.ts` sets `images: { unoptimized: true }` — do not add image optimization config without understanding why this was chosen.
- Prisma model names are **lowercase** (e.g. `user`, `product`, `order`) — do not capitalize them.
- `.env` contains credentials; never commit or log these values.
- The middleware only protects `/admin` routes. Customer API routes handle their own auth checks.
- `globals.css` imports `tw-animate-css` and Leaflet CSS. Tailwind v4 uses `@import` not `@tailwind` directives.
- **Turbopack dev route 404s**: if nested admin routes (e.g. `/admin/products/edit/[id]`) suddenly return 404 while top-level pages work, the dev server's route tree is stale (common on slow/network drives). Fix by restarting `npm run dev`; delete `.next` first if the issue persists.
