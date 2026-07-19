# EVSafe Web App v2

Responsive web application for **eVehicleSafe** — EV safety product authentication and social feed.

Built from [`WEB_APP_SPEC.md`](./WEB_APP_SPEC.md) with additional features tracked in [`WEB_APP_FEATURES.md`](./WEB_APP_FEATURES.md).

## Stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Tailwind CSS v4**
- **Firebase** (Auth, Firestore, Storage, Remote Config, FCM)
- **Odoo** JSON-RPC (client-side, matching mobile app)
- **Zustand** for lightweight state

## Getting started

```bash
npm install
cp .env.example .env.local
# Fill in Firebase config values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Route | Description |
|---|---|
| `/` | Public landing page (F5) |
| `/login` | Authentication (sign in / sign up / reset) |
| `/privacy` | Privacy policy |
| `/app` | Authenticated app shell (4 tabs via `?tab=`) |
| `/app/scan` | QR / barcode scanner |
| `/app/validate` | Manual product registration |
| `/app/product` | Product details / registration |
| `/app/admin/users` | Administrator user management (F2–F4) |

## Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

## Features implemented

- Public landing page + authenticated app shell
- Firebase Auth (email, Google, Apple) + Firestore profile
- Odoo JSON-RPC with 6-hour client cache
- **Server-side Odoo image proxy** (`/api/odoo-image`) for authenticated feed images
- Social feed with search, likes, favourites, share, YouTube embeds
- **Full-screen image gallery** with swipe and pinch-zoom
- **Notification deep-links** via `?post=<id>` and FCM foreground/background handlers
- Product scan, manual validation, registration, profile management
- Admin user panel (roles, disable/enable)

## Brand assets

Official logos live in `brand-assets/`. Web copies are in `public/brand/`.

## Spec documents

- [`WEB_APP_SPEC.md`](./WEB_APP_SPEC.md) — full mobile-parity specification
- [`WEB_APP_FEATURES.md`](./WEB_APP_FEATURES.md) — web-only additions (roles, admin panel, landing page)
