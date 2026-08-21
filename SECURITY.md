# Security Guide — ShopSphere

This document describes the store's security architecture, the hardening applied in the
August 2026 security pass, and how to operate/verify it.

## Authentication systems (three, deliberately separate)

| System | Used by | Mechanism | Lifetime |
| --- | --- | --- | --- |
| NextAuth v5 (`lib/auth.ts`) | Customers (storefront) | JWT session cookie; credentials + Google + phone-OTP | 30 days |
| Admin JWT (`lib/admin-jwt.ts`, `lib/admin-cookie.ts`) | Admin dashboard | HS256 JWT in httpOnly cookie; role re-checked against DB on **every** request (`getAdminSession`) | 7 days |
| Legacy token (`lib/jwt.ts`) | `auth/login` + `auth/me` endpoints | jsonwebtoken HS256 cookie | 7 days |

They are **not interchangeable**: an admin cookie cannot access customer APIs and vice versa.
`proxy.ts` guards `/admin` pages; every admin API route independently calls `getAdminSession()`.

## Hardening applied

### API authorization
- **Contact messages** — `GET /api/contact` dumped all customer PII to anyone. Now admin-only.
- **Cart** — `POST /api/cart`, `GET /api/cart/list`, `GET /api/cart/[userId]`, `POST /api/cart/remove-item`
  allowed reading/writing/deleting *any* user's cart. All cart mutations are now session-scoped
  with ownership checks (`cart.userId === session user`). Dead endpoints were deleted.
- **Addresses** — update/delete/set-default across `/api/address*` and `/api/account/address*`
  accepted any address id (IDOR). All now scoped via `userId` in the `where` clause.
- **Orders** — `orders/place` and `payment/create-order` trusted a client-supplied `addressId`;
  an attacker could ship to another user's saved address. Both verify ownership now.
  Dead unauthenticated order-creation endpoints (`orders/create`, `orders/user`) deleted.
- **Coupons / categories / genders / sizes** — create/update/delete were public. Anyone could mint
  a 100%-discount coupon. All write methods now require an admin session (admin forms keep working).

### Auth infrastructure
- **JWT secret validation** — if `JWT_SECRET` was unset, tokens were signed with the literal string
  `"undefined"` (publicly known → forgeable admin sessions). Both JWT libs now fail closed at
  startup unless the secret is ≥ 32 characters.
- **Admin login lockout & audit trail** — new `LoginAttempt` model records every admin login
  attempt (email, success, IP, user agent). 5 failures within 15 minutes locks the email for
  15 minutes. Visible at **Admin → Security**.
- **OTP hardening** — OTPs are generated with `crypto.randomInt` (was `Math.random()` /
  `otp-generator`), compared timing-safely, capped at 5 verification attempts per window, and
  sending is rate-limited per email and per IP (anti email-bombing).
- **Role gates** — partner accounts can no longer authenticate through the customer NextAuth flow
  (they have their own portal). Unverified customers remain blocked.
- **Token-minting script removed** — `_admintoken.ts` (printed valid admin tokens) deleted.

### Payments
- **Webhook implemented** — `/api/payment/webhook` verifies Razorpay's HMAC signature over the raw
  body (`RAZORPAY_WEBHOOK_SECRET`) and fulfills paid orders server-to-server. Fails closed (503)
  when unconfigured. Fulfillment is shared with the client callback via
  `lib/payment-fulfillment.ts` and is idempotent: an atomic `PENDING → PAID` claim means stock,
  coupons and carts are processed exactly once even under retries/concurrency.
- **Timing-safe signature comparison** in both payment verification paths.

### Uploads
- Admin uploads restricted to images (JPEG/PNG/WebP/GIF/AVIF), max 10 MB, sanitized Cloudinary
  folder path (no traversal). Customer uploads already had type+size limits.

### Rate limiting
- `lib/security.ts` provides an in-memory sliding-window limiter applied to: admin login,
  contact form, OTP send/verify, forgot-password. Best-effort per serverless instance; for strict
  global limits add Redis or a DB-backed counter.

## Required environment variables

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Signs all tokens. Must be ≥ 32 random chars. Rotating it invalidates all sessions. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Payment creation + client-callback signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook signature verification. Configure the same value in Razorpay Dashboard → Settings → Webhooks, listening to `payment.captured` and `order.paid`. |

The **Security page** in the admin sidebar shows live status for all of these.

## Remaining recommendations

1. **Rotate `JWT_SECRET`** if it may ever have been exposed (invalidates all sessions once).
2. **Configure the webhook secret** so payments confirm even if a customer closes the browser
   before the callback fires.
3. Consider hashing OTPs at rest and moving rate-limit counters to a shared store (Redis) for
   multi-instance deployments.
4. Add 2FA (TOTP) for admin accounts as a follow-up.
5. Keep `npm audit` / Dependabot enabled for dependency CVEs.
