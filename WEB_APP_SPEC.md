# EVSafe — Responsive Web Application Build Specification

> **Purpose of this document.** This is a complete, implementation-ready specification for building a **responsive web application** that replicates every feature of the existing **EVSafe** Flutter mobile app (`evsafe_app`). It was produced by reverse-engineering the mobile codebase. An AI coding agent (or a developer) should be able to build the web app from this document alone.
>
> **Product.** EVSafe (internal name **"eVS"**) by **PJCC Electric Vehicle Pty Ltd** — an EV‑safety product **authentication + social feed** app. Users sign in, browse a social feed (like / favourite / share), **register and validate physical EV‑safety products** (e.g. insulating gloves) by scanning a QR/barcode or entering a serial manually, view their registered products and expiry dates, and manage their profile.
>
> **Source app version:** `1.0.28+45` (Flutter, GetX, Firebase, Odoo).
>
> **Companion document:** additional (beyond-parity) features and functionalities for the web app are tracked separately in [`WEB_APP_FEATURES.md`](./WEB_APP_FEATURES.md) — read both before building.

---

## Table of contents

1. [Target stack & conventions](#1-target-stack--conventions)
2. [Design system](#2-design-system)
3. [Information architecture & navigation](#3-information-architecture--navigation)
4. [Backend integration (Firebase + Odoo)](#4-backend-integration-firebase--odoo)
5. [Data models](#5-data-models)
6. [Feature specs](#6-feature-specs)
   - 6.1 [Authentication](#61-authentication)
   - 6.2 [App shell & bottom navigation](#62-app-shell--bottom-navigation)
   - 6.3 [Home — social feed](#63-home--social-feed)
   - 6.4 [Favourites](#64-favourites)
   - 6.5 [Products — list, scan, validate, register](#65-products--list-scan-validate-register)
   - 6.6 [Profile / Account](#66-profile--account)
   - 6.7 [Push notifications](#67-push-notifications)
7. [Cross-cutting UI: states, dialogs, toasts, helpers](#7-cross-cutting-ui-states-dialogs-toasts-helpers)
8. [Web-specific adaptations](#8-web-specific-adaptations)
9. [Out of scope / vestigial code — do NOT build](#9-out-of-scope--vestigial-code--do-not-build)
10. [Acceptance checklist](#10-acceptance-checklist)

---

## 1. Target stack & conventions

| Concern | Decision |
|---|---|
| **Framework** | **Next.js (App Router) + React + TypeScript** |
| **Styling** | Tailwind CSS (utility-first). A single brand theme (see §2). |
| **State management** | React Context + hooks, or a light store (Zustand/Jotai). The mobile app uses **GetX** reactive observables (`.obs`) and a per-feature controller — map each GetX controller to a store/hook (`useHomeStore`, `useAuthStore`, etc.). |
| **Data fetching** | `fetch`/TanStack Query. Preserve the **6‑hour client cache** behaviour for Odoo reads (see §4.4). |
| **Firebase** | Firebase **JS SDK v9+ (modular)** used **directly from the browser** — Auth, Firestore, Storage, Remote Config, Cloud Messaging (web push), Analytics. |
| **Odoo** | Called **directly from the client** via JSON‑RPC (replicating the mobile app exactly — see the security note below). |
| **Responsiveness** | Mobile‑first. Must work from 320px phones up to desktop. The mobile app supports **portrait and landscape**; the web app must be fully fluid. See §8 for the desktop adaptation of the bottom nav and feed. |
| **Routing** | Client routes mirror the mobile routes plus web niceties (deep links, back/refresh). See §3. |

> ⚠️ **Security note (accepted trade-off).** This spec, per project decision, replicates the mobile app **as‑is**, meaning Firebase and Odoo are both called from the browser. The Odoo integration authenticates with a **shared Odoo user id + password** pulled from Firebase Remote Config. In a browser SPA these values are visible to end users via dev tools/network tab. This is the same exposure the mobile app has (where they are also shippable secrets). If hardening is ever desired, move the Odoo JSON‑RPC calls behind a Next.js Route Handler / API route (a backend‑for‑frontend) and keep the Odoo credentials server‑side — no UI changes required. **Not required for parity; flagged once.**

### Conventions used in this document
- **Exact user‑facing strings are quoted** `"like this"` — reproduce them verbatim (including quirks noted).
- Odoo returns the string `"false"`/`"null"` for empty fields. A helper **`avoidFalse`** maps `"false"`/`"null"` → `"--"`; **`falseToNull`** maps them → `null`. Reproduce this everywhere Odoo data is displayed.
- Fonts: **Inter** (all UI/body), **Roboto** (social feed author/meta), **FiraMono** (debug view only).

---

## 2. Design system

> **Two sources of truth, reconciled.** §2.1–2.5 document the **in-app UI tokens** reverse-engineered from the mobile code (near-monochrome `#1F1F1F`, Inter/Roboto) — reproduce these for screen-level parity. §2.6 documents the **official eVehicleSafe brand identity** from the repo's `brand-assets/` pack — this governs logos, brand colours, and any marketing-facing surface (favicon, app icons, splash, share images). Where the two conflict, §2.6 lists the conflict and the recommended resolution.

### 2.1 Brand palette (in-app UI tokens)
The app is intentionally **near-monochrome**: one brand colour drives primary/success/danger/buttons.

| Token | Hex | Usage |
|---|---|---|
| `colorBrand` / `colorPrimary` / `colorSuccess` / `colorDanger` / `buttonBg` / `formLabel` | `#1F1F1F` | Buttons, links, primary actions, icons, form labels. (Success & danger are the **same** brand black by current config.) |
| `background` | `#F4F4F4` | Page background, status/app-bar surfaces, avatar backgrounds. |
| `appBarBg` / `bgWhite` | `#FFFFFF` | App bars, cards, nav bar chips. |
| `bgColor` | `#F9FAFB` | Alt surface. |
| `textColor` (light) | `#0C111D` | Primary text. |
| `textColorProfile` / `textColorProfilePhone` | `#0C111D` | In the shipped **light** theme these resolve to the same near-black as `textColor`. (The `#475467` / `#667085` greys in source are the dark-mode branch of these tokens; the app ships light-only, so the effective value is `#0C111D`.) |
| Border `colorBorderSide` | `#EAEAEA` | Input/card borders. |
| Border `colorBorderSide2` / `dividerColor` | `#EDEDF3` (@70%) | Dividers. |
| `redColor` | `#F97066` | (accent, mostly unused) |
| Nav bar fill (`colorSuccess`) | `#1F1F1F` | Bottom nav pill background. |

**Recurring inline colours (not tokenised — replicate):** feed muted grey `#99A2AD`, feed body text `#606060`, feed link `#4C76B5`, search-highlight **orange** (`FontWeight ~650`), serial/expiry red `#E73417`, feed divider `#EBF2FA`, search-field border `#D6D6D6`, list-row bottom border `#E7E7E7`.

### 2.2 Typography
- Global font: **Inter** (a variable font — the app uses `FontVariation('wght', N)`; on web use `font-variation-settings: 'wght' N` or Inter weights 400/500/600/700/800).
- Social feed uses **Roboto** for author name + meta.
- App-bar titles: Inter 22px / weight 500 (600 for the Profile title).
- Base body: 14px.

### 2.3 Core components to build (design-system primitives)
Reproduce these reusable components (names from the mobile app given for traceability):

| Component | Web equivalent | Notes |
|---|---|---|
| `ThemeButton` | Primary button | Pill (`border-radius: 100px`), bg `#1F1F1F`, white text, Inter 600, default 16.5px, ~20px vertical padding. Subtle shadow. |
| `ThemeGradientButton` | Gradient CTA | Pill, gradient **teal `#4DB6AC` → blue `#2196F3`** (left→right), white text, height ~56px, optional leading icon. Used for **"Register"** on manual validation. |
| `ThemeTextField` (+ `.readOnly`) | Text input | Rounded 10px outline border. Supports `label`, `hint`, `prefixText`, prefix/suffix icon, `errorText`, `isRequired` (appends red ` *` and default validator `"{label} is required"`), `labelOnTop`, `obscureText`, `maxLength`, `keyboardType`. Label 12px `#1F1F1F`; hint `#2D2D2D`. |
| `PlainText` | Text | Inter, weight as numeric variation. |
| `LoaderView` | Brand loader | 150×150 shimmer over the `evsafe_long` logo (base `#5E8FCC`, highlight `#53BCB2`). Use as the global loading spinner. |
| `CreateShimmer` / skeletons | Skeleton loaders | Feed/list loading = **5 skeleton cards**. Dark-mode aware in source (web can ship light only). |
| `ThemeBadge` | Count badge | 18×18 circle, bg `#1F1F1F`, text `#F4F4F4` 14px. Used on the Account tab. |
| `PageContainer` | Page wrapper | Standard padding (L/R 16px, top 10px); optional pull‑to‑refresh; optional busy overlay (centered `LoaderView` on white‑40% scrim). |
| `RowSpace` / `ColumnSpace` | Spacers | Simple gap helpers. |

### 2.4 Dialogs, toasts, error surfaces
- **Confirm/alert dialog** (`PopUps.showDialogue`): iOS‑style alert with title, message, **Cancel** + **OK** (labels overridable; cancel hideable). Used for logout, delete account, remove product, privacy policy.
- **Error dialog** (`PopUps.showError`): full dialog with a **Lottie animation** (`assets/error.json`), text `"Error: {message}"` at 22px, dismiss button **"OK"**. `filterError()` maps any `SocketException`/network error → **"Failed to connect to internet, please try again"**.
- **Radio-list dialog** (`PopUps.showCustomDialog`): single-select list with a **"CLOSE"** button. (Rarely used.)
- **Toasts/snackbars** (`Snack`): bottom-positioned.
  - `Snack.oK(content, title="Success")` — 2s, neutral.
  - `Snack.warn(content, title="Warn!")` — amber.
  - `Snack.error(content, title="Error!")` — white bg, danger text, **stays 300s** (until dismissed) unless `autoDismiss`; has a **"Details"/"Close"** button.
- **Relative time** (`timeago` + custom messages): compact form — `now`, `{m}m`, `{h}h`, `{d}d`, `{mo}mo`, `{y}y`. *(Source quirks, keep or deliberately fix: "about an hour" renders as minutes with an `m` suffix; "a day" renders as `{d}d {h}h`; "about a month" renders as days `{d}d`.)*

### 2.5 Assets to recreate/obtain
Bundled placeholder imagery + icons live in a `dataset.dart` map (base64) — **not business data**, just fallbacks:
- `images` map: `gloves`, `image1`, `image2`, `logo`, `icn`, `demo`.
- `icons` map: `user`, `settings`, `phone`, `notifications`, `mail`, `logout`.

Image/icon assets referenced by screens (obtain web equivalents — SVG/PNG): `evsafe.png` (logo mark), `evsafe_long.png` (wordmark/splash), `google.png`, `apple.png`, `home.png`/`s_home.png`, `product.png`/`s_product.png`, `fav.png`/`s_fav.png`, `user.png`/`s_user.png`, `clock.png`, `like.png`, `like_o.png`/`like_l.png`, `qr.png`, `manual.png`, `noResultFound.png`, `errorImg.png`, `no_fav.png`, `task_empty.png`, `error.json` (Lottie).

> For the logo assets specifically, do **not** rasterise from the mobile PNGs — the repo's `brand-assets/` pack (§2.6) supplies official SVG masters. (`assets/images/evsafe_long.png` in the mobile app is byte-identical to `brand-assets/…/eVehicleSafe_Logo-Long_Full-Colour-Black_RGB.png`; use the matching `.svg` on web.)

### 2.6 Official brand identity (`brand-assets/`)

**Source:** `brand-assets/` at the repo root — *eVehicleSafe Logo/Brand Guidelines v1.0 (April 2025)*, produced by 5818 Digital (`design@5818.digital`), plus the full logo pack in RGB (digital: `.ai`/`.eps`/`.pdf` + `.svg`/`.png`/`.jpg`) and CMYK (print: `.ai`/`.eps`/`.pdf`). **Web builds must use the RGB `.svg` files.** Brand name: **eVehicleSafe**.

**Logo system:**

| Variant | What it is | Files (under `brand-assets/RGB - For Digital Applications/`) | Web use |
|---|---|---|---|
| **Primary (Long) wordmark** | "eVehicleSafe" — black text with the blue→teal gradient applied to the leading "e" and "Safe" | `Long Logo/Full Colour - Black/*.svg` (+ White, Mono-Black, Mono-White colourways) | Login screen wordmark, splash/`LoaderView`, page footer — replaces `evsafe_long.png` |
| **Secondary (Short) logo, Option 1** | White "e" on a gradient rounded square (app-icon style) | `Short Logo/Option 1 - Full Colour/*.svg`; ready-made raster: `eVehicleSafe Logo (512 x 512 px).png` | Favicon, PWA/home-screen icons, social profile avatar |
| **Secondary (Short) logo, Option 2** | Gradient "e" glyph alone (transparent background) | `Short Logo/Option 2 - Full Colour/*.svg` | Feed app-bar mark / avatar fallback (replaces `evsafe.png` where a square icon isn't wanted) |
| Ready-made banners | LinkedIn banner, site header, email signature | `eVehicleSafe - LinkedIn.png`, `eVehicleSafe Header.png`, `eVehicleSafe_email_signature.png` | Social share / OG images, email |

**Official colours (from the guidelines):**

| Token | HEX | RGB | Usage per guide |
|---|---|---|---|
| eVS Blue | `#558CC8` | 85/140/200 | Gradient start |
| eVS Teal | `#41BEB4` | 85/190/180 | Gradient end |
| **eVS Gradient** | Blue → Teal at **45°** | — | The primary colourway (logo "e"/"Safe", hero surfaces) |
| eVS Black | `#000000` | 0/0/0 | Logo text |
| eVS Grey | `#7F7F7F` | 127/127/127 | Body text |
| eVS Light Grey | `#E6E6E6` | 230/230/230 | Backgrounds |
| White | `#FFFFFF` | — | Inverted logo, presentation backgrounds |

> ⚠️ **Exact gradient stops:** the shipped production SVGs use `#578ECA → #3CBDB2` — slightly different from the guide's stated hexes. When reproducing the gradient in CSS, use the SVG-sampled values (`linear-gradient(45deg, #578ECA, #3CBDB2)`) or simply embed the SVGs so the logo always self-carries its gradient.

**Brand typeface:** **Nunito** (Google Fonts, free for commercial use; weights ExtraLight→Black + italics; rounded terminals). Fallback: **Arial Rounded**.

**Usage rules (enforce in the web app):**
- Clear space: keep a "safe area" of **50% of the logo height** on all sides, free of copy/graphics/high-contrast imagery. Not baked into the files — enforce via layout padding.
- Minimum size: logo height ≥ **3mm / ~9px**; when width-constrained, switch to the short "e" logo.
- Prefer the full-colour **black-text** variant on white/light backgrounds; use the White/Mono variants only on dark or single-colour contexts. Mono is the fallback when multiple colours can't be produced.
- Never: recolour or reposition logo elements, italicise/skew, rotate/distort, apply drop shadows/glows, or place on busy backgrounds. (Recolouring the short logo is allowed only for "rare, special occasions".)

**Conflicts with the in-app tokens — decisions for the web build:**
1. **Gradient mismatch:** the mobile `ThemeGradientButton` and the scanner viewport frame use Material teal→blue `#4DB6AC → #2196F3` (left→right), which is *not* the official eVS gradient. Recommended: switch both to the brand gradient (`45°, #578ECA → #3CBDB2` per the SVGs) on web; keep the mobile values only if pixel-parity with the current app is prioritised over brand correctness.
2. **`LoaderView` shimmer colours** (`#5E8FCC` / `#53BCB2`) are hand-picked approximations of eVS Blue/Teal — acceptable, or normalise to the official values.
3. **Typeface:** the app UI ships Inter (+ Roboto in the feed) while the brand typeface is Nunito. Recommended: keep **Inter for in-app UI parity** (per §2.2) and use **Nunito for marketing-facing surfaces** (login hero, onboarding, emails, OG images); a full Nunito switch is a deliberate rebrand decision, not parity.
4. **Palette:** the near-monochrome `#1F1F1F` UI chrome (§2.1) does not appear in the brand guide, and the brand's blue/teal does not drive any in-app control colours. Treat `#1F1F1F` as the app-UI token set and the eVS palette as the brand layer; don't mix arbitrarily.

---

## 3. Information architecture & navigation

### 3.1 Routes
| Mobile route | Web route | Screen | Guard |
|---|---|---|---|
| `/home` (INITIAL) | `/` | App shell (4 tabs) | **Auth required** |
| `/login` | `/login` | Auth screen | Public |
| `/product` | `/product` (or `/products/:serial`) | Product details / registration | Auth required |
| — (tab) | `/` `?tab=home\|product\|favorite\|account` | Tabs within shell | Auth required |
| — (pushed) | `/scan` | QR scanner | Auth required |
| — (pushed) | `/validate` | Manual validation form | Auth required |

The mobile shell keeps the 4 tabs inside a single `/home` route and switches by index. On web, prefer real URLs per tab (`?tab=` or nested routes) so browser back/refresh and deep links work.

### 3.2 Auth guard & redirect flow (reproduce exactly)
- `/home` (and any protected route) is guarded. If **not** authenticated → redirect to `/login`, **carrying the intended destination** (`{ redirect: true, route: <target> }`).
- After successful auth (`handleLogin`):
  - Upsert the Firebase user into Firestore `users/{uid}` (only if the doc doesn't already exist).
  - If there was **no** redirect target → go to `/` (Home), clearing history.
  - If there **was** a target ≠ Home → navigate to it (optionally rebuilding the back-stack so Back returns to Home).
- **Web equivalent:** capture a `?redirect=<returnUrl>` query param on `/login`; after auth, `router.replace(returnUrl ?? '/')`.

### 3.3 App boot sequence (mobile `main()`)
1. Init Firebase; wire Crashlytics for fatal errors.
2. Load SharedPreferences equivalent (browser `localStorage`/IndexedDB) as the offline cache.
3. Init `AuthService`: read current Firebase user; **fetch Firebase Remote Config** (Odoo connection params); then **authenticate to Odoo** (`/web/session/authenticate`) to obtain a session cookie.
4. Render app.
5. **After** first render (non-blocking): init push notifications (request permission, subscribe to topic `all_users`).

---

## 4. Backend integration (Firebase + Odoo)

The app uses **two backends simultaneously**: **Firebase** (identity + per‑user data + media + config + push) and **Odoo** (product catalog, serial validation, social posts). Every post/product is Odoo content **enriched with per‑user Firebase state**.

### 4.1 Firebase — services used
| Service | Use |
|---|---|
| **Auth** | Email/password, Google, Apple sign-in. Current user = `firebase.auth().currentUser`. |
| **Firestore** | Per-user profile, saved products, favourite posts, and global post likes (schema in §5). |
| **Storage** | Profile photos at `images/{uid}`. |
| **Remote Config** | Odoo connection params (below). Fetch timeout 8s; min fetch interval 1 day; also listens for live config updates. |
| **Cloud Messaging (FCM)** | Broadcast push; topic `all_users`. Web push via service worker + VAPID. |
| **Analytics + Crashlytics** | Optional on web (Analytics yes; Crashlytics → use a JS error reporter). |

**Remote Config keys** (drive the Odoo connection — do not hardcode):
- `baseUrl` → Odoo base URL (e.g. `https://…/`).
- `db` → Odoo database name.
- `user_id` → Odoo login (string).
- `id` → Odoo user id (int) used in `execute_kw`.
- `password` → Odoo user password.

### 4.2 Odoo — transport
- **Protocol:** JSON‑RPC 2.0 over HTTPS **POST**.
- **Main endpoint:** `POST {baseUrl}/jsonrpc`
- **Auth endpoint (session):** `POST {baseUrl}/web/session/authenticate` with body:
  ```json
  { "id": "<uuid-v1>", "jsonrpc": "2.0", "method": "call",
    "params": { "db": "<db>", "login": "<user_id>", "password": "<password>", "context": {} } }
  ```
  The returned `set-cookie` is captured in memory (`AuthService.cookie`). **Correction (verified in source):** this session cookie is *not* actually attached to `/jsonrpc` calls — those read a separate, never-populated stored cookie, so they go out with an empty `Cookie` header. `execute_kw` calls authenticate purely via the `db` / `uid` / `password` args in the payload. The session cookie's real consumer is **feed image loading** (see the "Feed image authentication" bullet below).
- **Request envelope** (`createPayload`):
  ```json
  { "id": "<uuid-v1>", "jsonrpc": "2.0", "method": "call", "params": <PARAMS> }
  ```
- **`PARAMS`** for model calls (`createParams`):
  ```json
  { "service": "object", "method": "execute_kw",
    "args": [ "<db>", <id:int>, "<password>", "<model>", "<model_method>", <input>, <filter> ] }
  ```
- **Headers:** `Content-Type: application/json`, `Accept: application/json`, `Authorization: Bearer <token>`, `Cookie: <cookie>`. *(In practice both `<token>` and `<cookie>` are always empty strings in the mobile app — the headers are sent but carry nothing.)*
- **Timeout:** 5 seconds.
- **Response handling:** success = HTTP ok and no `error` key; data is in `result`. Odoo session expiry (error code `100`) is **detected and flagged only** — the mobile app's handler is a no-op stub and it never re-authenticates automatically; the failure just surfaces via the error dialog (§2.4). **Web: implement a real re-authenticate-and-retry here** (safe improvement over source).
- **Feed image authentication (new — verified in source):** `social.stream.post` image URLs are absolute Odoo URLs that require the Odoo session. The mobile app fetches every feed image with header `Cookie: frontend_lang=en_AU; session_id=<sid>` where `<sid>` is extracted from the `/web/session/authenticate` `set-cookie`. A browser `<img>` tag cannot attach a custom `Cookie` header to a cross-origin request — see §8 for the required web adaptation (same-origin image proxy or public Odoo images).

### 4.3 Odoo — methods (the complete set the app uses)
| Repository method | Model | Odoo method | `input` | `fields` / notes |
|---|---|---|---|---|
| `getSocialStreamPosts()` | `social.stream.post` | `search_read` | domain `[["published_on_app","=",true]]` | `fields: []` (all). **This is the Home feed source.** Post-process: JSON-decode `stream_post_image_urls` → `image_urls[]` + `image`; derive `youtube_video_id` from `post_link`/`link_url`. Image URLs are used **exactly as returned** (absolute URLs, *not* prefixed with `baseUrl` — unlike the legacy `social.post` variant) and require session-cookie auth to load (§4.2). |
| `getSocialPosts()` | `social.post` | `search_read` | domain `[["state","=","posted"]]` | `fields: [id,name,image_urls,display_message,create_date,create_uid,push_notification_target_url]`. (Alternate/legacy feed; prefix image URLs with `baseUrl`. Home uses the stream variant above.) |
| `getAllProducts()` | `product.product` | `search_read` | — | `fields: [id,name,display_name,create_date,create_uid,default_code,categ_id,product_variant_id,image_128]`. Product **catalog**. |
| `getProductDetails({serial})` | `stock.lot` | `get_product_expiry_info` | `[serial]` | Returns expiry/validation `Map` for a scanned serial. |
| `validateProductManual({serial,buildDate,batch})` | `stock.lot` | `get_product_expiry_info_v2` | `[serialNumber, batchNumberLast5, buildDate]` | **Note argument order:** serial, batch, date. Returns validation `Map`. |

**YouTube extraction regex:** `(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]+)`.

### 4.4 Caching (build the *intended* behaviour — the mobile implementation is broken)
- **Intended design:** Odoo `search_read` responses are cached client-side (mobile: SharedPreferences; web: `localStorage`/IndexedDB) under the model key (`social.stream.post`, `product.product`, …) with a **6‑hour TTL**; reads return cache when fresh unless `forceRefresh` is set (pull-to-refresh sets it); a per-key timestamp is stored alongside.
- **Actual mobile behaviour (source bug, verified):** the timestamp is *written* under the key `{<model>}_time` (literal braces — the code interpolates `"{$key}_time"`) but *read back* from `<model>_time` (no braces). The freshness check therefore never finds a timestamp and **always reports stale**, so in practice every read hits the network and the cache only serves as a **fallback when the network call fails**. Additionally, `getAllProducts()` never consults the TTL at all (always live; cache = failure fallback), and the cached branch of `getSocialStreamPosts()` post-processes with the `social.post` handler (which expects an `image_urls` field) — a second latent bug that is only unreachable because the freshness check never passes.
- **Web decision:** implement the intended 6‑hour TTL correctly (fresh cache honoured unless `forceRefresh`), and keep the useful part of the accidental behaviour — fall back to the last cached payload when a live fetch fails.

### 4.5 Firebase Firestore access patterns
- `updateUser(user)` — create `users/{uid}` **only if it doesn't exist** (does not overwrite existing).
- Products: `getUserProducts()`, `updateUserProduct({product})` (doc id = `product.serial`; strips the nested `product` field before save), `removeUserProduct({product})`.
- Favourites (posts): `getUserPosts()` → map keyed by post id; `updateFavouritePost({post})` **toggles** `users/{uid}/posts/{postId}` (doc exists = favourited; create → returns `true`, delete → returns `false`).
- Likes: `getPostLikes()` → map keyed by post id; `updatePostLikes({post})` toggles the current `uid` inside `post_likes/{postId}.likes[]`, returns the new like count.

---

## 5. Data models

### 5.1 Firestore schema
```
users/{uid}
  uid, displayName, email, emailVerified, phoneNumber, photoURL,
  metadata: { creationTime, lastSignInTime },
  providerData: [ { providerId, displayName, photoURL, uid } ]

users/{uid}/products/{serial}
  serial, product_id, batch_number, manufacturing_month, year,
  expired_date, display_name, image_128, …   // the "product" join field is stripped before save

users/{uid}/posts/{postId}
  post_id            // membership = favourited

post_likes/{postId}
  likes: [ uid, … ]  // membership of uid = liked
```
Storage: `images/{uid}` → profile photo blob.

### 5.2 Social post (feed item) — fields consumed by the UI
`id`, `author_name`, `create_date` (→ relative time), `message` (aka `display_message`; body text, may be `"false"`), `image_urls[]` (from `stream_post_image_urls`), `image`, `youtube_video_id` (derived), `is_portrait` (bool → 9:16 vs 16:9), `logo` (avatar; see quirk below), plus client-injected `favourite` (bool), `like` (int count), `has_like` (bool), `display_name` (used for search matching).

### 5.3 Product records
**Catalog (`product.product`):** `id`, `name`, `display_name`, `create_date`, `create_uid`, `default_code`, `categ_id`, `product_variant_id`, `image_128` (base64; `"false"` = none → fall back to bundled `gloves`).

**Scanned/validated/saved product:** `serial` (string), `product_id` (FK → catalog `id`), `product` (resolved catalog map, injected client-side), `batch_number`, `manufacturing_month`, `year`, `expired_date` (**null ⇒ invalid serial** — this is the validity gate), `success` (bool | `1` | `"true"`), `message` (failure reason), `error` (backend error string).

**Validity rule (reproduce exactly):** a serial is **valid/genuine** iff the backend returns a record with a **non-null `expired_date`** (and a truthy `success`/`product_id`). Otherwise it is invalid → show **"Not a Valid Serial Number"** / **"Invalid Information"**.

---

## 6. Feature specs

Each feature below lists: purpose, layout (top→bottom), interactions, data sources, states, and **exact strings**. Build every screen to be responsive (see §8).

### 6.1 Authentication

**Route:** `/login` (public). **Single screen** with a body region that **swaps between three modes** — Sign In (default), Sign Up, Reset Password — without changing route. Social login + privacy + mode toggle are visible in **all three** modes.

**Layout (top→bottom):**
1. Logo wordmark (`evsafe_long`), centered.
2. **Headline** (`PlainText`, bold 24px, letter-spacing): `"Please Log In"` (sign in) / `"Sign Up"` / `"Reset password"`.
3. **Dynamic body** (one of):
   - **Sign In:** Email field + Password field; **"Forgot Password?"** link (right-aligned) → switches to Reset mode; **"LOGIN"** button.
   - **Sign Up:** Email + Password + **Repeat Password** fields; **"SIGN UP"** button.
   - **Reset:** Email field only; **"or Sign In?"** link → back to Sign In; **"RESET"** button.
4. Divider text: `"-- OR CONTINUE WITH --"`.
5. **Social buttons** (row): **Google** (`google.png`) always; **Apple** (`apple.png`) **only when available** (iOS/macOS/Safari — feature-detect on web; otherwise hide).
6. Privacy line (RichText): `"By signing in, you agree to our"` + **" Privacy Policy"** (brand-coloured, tappable → opens the privacy dialog, see below). *(Note: " Terms" and " and" spans are commented out in source — show only Privacy Policy.)*
7. **Mode toggle** (bottom): Sign In shows `"Don't have an account?"` + **" SIGN UP"**; Sign Up shows `"Already have account?"` + **" LOGIN"**.
8. **Full-screen loading overlay** while any auth call is in flight (white 90% scrim + `LoaderView`).

**Fields & validation (client-side is empty-checks + password match only; Firebase handles the rest):**
| Field | Label | Rules |
|---|---|---|
| Email | `"Email"` | non-empty. Empty → `"Please insert email"` (sign in/reset) or `"Please insert userId"` (sign up). Errors render **inline** under the field. |
| Password | `"Password"` | non-empty, **always obscured** (no visibility toggle in source; you may add one). Empty → `"Password field is empty"`. |
| Repeat Password | `"Repeat Password"` | non-empty → `"Please repeat the password"`; must equal Password → else `"Password doesn't match"`. |

**Auth methods & flows:**
1. **Email sign in** → `signInWithEmailAndPassword` → on success set current user + `handleLogin()`.
2. **Email sign up** → validate match → `createUserWithEmailAndPassword` → `handleLogin()`. Sign-up errors show as **toasts** (`Snack.error`), not inline: `weak-password` → `"The password provided is too weak."`; `email-already-in-use` → `"The account already exists for that email."`; `invalid-email` → `"The given email is invalid"`.
3. **Reset password** → `sendPasswordResetEmail` → stays on screen, toast **"Please follow Email to reset password"**.
4. **Google** → `signInWithGoogle` (scopes `email`, `profile`) → on failure error dialog **"Google SignIn Failed. Try again!"**.
5. **Apple** → `signInWithApple` (scopes email + fullName; sets displayName from Apple name on first grant) → on failure **"Apple SignIn Failed!"**.

**Sign-in Firebase error mapping (inline):** `user-not-found` → email error `"No user found for this email."`; `wrong-password` → password error = the humanised code (`-` → space, words capitalised: **"Wrong Password"**); `invalid-email` → `"Invalid Email"`; `invalid-credential` → `"Invalid Credential"`; other → humanised code. **Reset-mode mapping:** `user-not-found` → inline email error `"No user found for this email."`; `invalid-email` → `"Invalid Email"`; `wrong-password` → error toast.

**Privacy dialog content (verbatim):**
> "The information you provide is voluntary however if you do not provide the requested information we may not be able to verify your details and properly attend to your enquiry. Your information will be used by PJCC ELECTRIC VEHICLE PTY LTD to process your request, be retained for reference for future enquiries and managed in accordance with our Privacy Policy. You may request access to your personal information by contacting us sales@evehiclesafe.com"

Dialog title **"Privacy Policy"**, single button **"CLOSE"**.

**Post-login:** run `handleLogin()` (see §3.2) — upsert user doc, then redirect to intended route or Home.

---

### 6.2 App shell & bottom navigation

**The authenticated app is a 4-tab shell.** Body swaps by selected tab index; a persistent bottom nav bar sits on top.

| Index | Tab label | Screen | Icon (idle → active) |
|---|---|---|---|
| 0 | **"Home"** | Social feed | `home.png` → `s_home.png` |
| 1 | **"Product"** | Products list / registration | `product.png` → `s_product.png` |
| 2 | **"Favorite"** | Favourited posts | `fav.png` → `s_fav.png` |
| 3 | **"Account"** | Profile | `user.png` → `s_user.png` — **has a badge** |

**Nav bar styling:** a floating **pill** (`border-radius: 70px`) filled brand black `#1F1F1F`, items spaced evenly. **Idle item = icon only** (white-tinted). **Active item = a white rounded "chip"** containing the (untinted) active icon **plus** its label in brand-black, weight 700. Only the active tab shows its label.

**Account badge:** shows a `ThemeBadge` with `messageCount` (a string, default `"0"` = hidden) at the icon's top-right — an unread/notification counter.

**Responsive:** the mobile bar shrinks and clamps width in landscape. On web (see §8): **bottom pill nav on phones**; on ≥ desktop widths, convert to a **top bar or left sidebar** while keeping the same 4 destinations, labels, and badge.

---

### 6.3 Home — social feed

**Purpose:** a LinkedIn-style **social feed** of posts from Odoo `social.stream.post`, searchable, with per-user **like** and **favourite** actions. **There is no carousel, categories, or product grid on Home — it is strictly a feed.**

**App bar (sticky, white):**
- **Logo** (`evsafe.png`, 50×50 circle). When the search field is focused it becomes a **back arrow** that unfocuses/collapses search.
- **Search field** (expanded, pill outline `#D6D6D6`, hint **"Search"**): live filtering as the user types; a red **clear (✕)** button appears when non-empty.
- (A notification bell exists in source but is **hidden** — don't build it.)

**Body:**
- **Loading:** 5 skeleton post cards.
- **Empty + active search:** image `noResultFound.png`, text **"No match found"**, action **"Back to home"** (clears search).
- **Empty + no search / server empty:** image `errorImg.png`, text **"No post on server.Please"**, action **"Refresh"**.
- **Populated:** a virtualized list of **post cards**.
- **Pull-to-refresh** (web: a refresh control / button): clears + refetches with `forceRefresh`.

**Post card (`SocialPostItem`) — top→bottom:**
1. **Header:** 50×50 avatar (falls back to `evsafe` logo — see quirk), **author name** (`author_name`, Roboto 16, `#1F1F1F`), a `•` separator + static label **"following"** (`#99A2AD`); second line: clock icon + **relative time** of `create_date`.
2. **Message body** (`message`): if < 100 chars show fully; else truncate to 100 chars + tappable **" ... see more"** to expand. Within the text: **URLs become links** (`#4C76B5`, open in a new tab) and the **current search term is highlighted orange**.
3. **Media:** if `youtube_video_id` present → inline YouTube player (aspect **9:16** when `is_portrait`, else **16:9**), with a fullscreen control; else if images → **multi-image collage** (LinkedIn-style layouts for 1/2/3/4+; `"+N"` overlay when > 4; tap opens a **full-screen swipeable pinch-zoom gallery**).
4. **Reaction count row** (only if `like > 0`): like icon + count.
5. Divider.
6. **Action row (three actions — verified in source):** **Favourite** toggle (icon `s_fav`/`fav` + label **"Favorite"**; when active the icon turns black and the label goes semibold, but the label colour stays grey `#99A2AD`), **Like** toggle (icon `like_l`/`like_o` + label **"Like"**; active = black icon + black label), and **Share** (icon `share.png` + label **"Share"**) — Share opens the OS share sheet with the **post's message text** (web: Web Share API with copy-link fallback).

**Interactions & effects:**
- Type/submit in search → **client-side filter** of the already-loaded feed: match where `display_name` **or** `message` contains the query (case-insensitive). *(Consider also matching `author_name`, which the card displays — a noted gap.)* Highlight matches in the body.
- Clear search → restore full feed, unfocus.
- Tap **Favourite** → toggle in Firestore (`users/{uid}/posts/{postId}`), optimistic update + refresh; toast **" Added to favourites"** / **" Removed from favourites"**.
- Tap **Like** → toggle uid in `post_likes/{postId}.likes[]`; toast **"Added to liked post"** / **"Removed from liked post"**.
- Tap URL → open external in new tab.

**Data assembly (`getSocialPost`)**: fetch `getSocialStreamPosts()`; fetch `getUserPosts()` (favourites) and `getPostLikes()`; for each post set `favourite = favourites.has(id)`, `like = likes[id].likes.length`, `has_like = likes[id].likes.includes(uid)`. Keep a **master list** (unfiltered) and a **filtered view** (search operates on the filtered view against the master). **No pagination** — the whole feed loads in one call; virtualize rendering.

**Avatar quirk (fix on web):** the source falls back to a `fakeimg.pl` placeholder when a logo exists — prefer rendering the real logo/author image; use the `evsafe` mark only as a true fallback.

---

### 6.4 Favourites

**Purpose:** the subset of feed posts the user has favourited. Uses the **same post card** as Home.

- **Data:** first load fetches stream posts + user favourites + likes, filters to favourited ids (`favourite = true`). After first load it derives from the in-memory feed (`posts where favourite == true`) so it stays in sync with Home toggles within a session.
- **Empty state:** image `no_fav.png`, text **"No Favourite Posts found, Please"**, action **"Add one"** → switches to the **Home** tab.
- **Loading:** 5 skeleton cards.
- **Un-favouriting on this screen removes the card immediately** (with the favourites toast).
- Like works the same as on Home.
- **Note:** pull-to-refresh is a **no-op** here in the source (refresh handler commented out) — you may either keep it inert or wire it to a real refetch (minor enhancement).

---

### 6.5 Products — list, scan, validate, register

Three distinct product surfaces — keep them separate:
1. **Products list** (Product tab, index 1)
2. **Registration container** (`/product`) hosting scan / manual entry and the post-scan detail card
3. **Product details** for an already-saved product

#### 6.5.1 Products list (tab 1)
- **Loading:** 5 skeleton product rows.
- **Empty:** image `task_empty.png`; heading **"You don't have any Product"** (note the curly apostrophe `'`); subtext **"Register your purchased product here!"**; button **"+ register your product"** → opens the scanner.
- **Populated:** header count **"{n} Item Found"** (n ≤ 1) / **"{n} Items Found"** (n > 1); a list of **product cards**; footer button **"+ register another product"** → scanner.
- **Product card (`ProductItem`):** product image (base64 `image_128`, else bundled `gloves`); **`display_name`** (default placeholder `"Ev vehicle gloves"`); **"Serial Number : "** (value in red `#E73417`); **"Expire In : "** (`expired_date` formatted `dd MMMM yyyy`); a **"View Details"** button → Product Details screen.
- **Pull-to-refresh** → refetch products (`getProducts`): fetch catalog (`getAllProducts`) → build `id→catalog` map; fetch `getUserProducts()`; join each saved product's `product_id` to the catalog.

#### 6.5.2 QR / barcode scanner (`/scan`)
- **Entry points:** "Scan product serial" card (icon `qr.png`) on the registration container; "+ register…" buttons on the list. The registration container also shows a second card — icon `manual.png`, label **"Manual Product Validation"** — that jumps straight to the manual form. *(Note the label inconsistency in source: the container card says "Manual Product **Validation**" while the scanner screen's fallback card says "Manual Product **Registration**". Reproduce as-is, or unify deliberately.)*
- **Layout (top→bottom):** top-right **✕ close**; heading **"Scan QR Codes Here"**; a **1:1 camera viewport** with a rounded **teal→blue gradient border**; an **animated red horizontal scan line** sweeping vertically; the live decoded value below; a **manual fallback** card (icon `manual.png`, label **"Manual Product Registration"**) → manual form; `evsafe_long` logo at the bottom.
- **Behaviour:** auto-start camera; on the **first successful decode**, stop and **return the decoded string** to the caller (which then opens the post-scan detail). Close (✕) returns to the Product tab.
- **Web adaptation (required):** replace the native `mobile_scanner` with a browser scanner — **`BarcodeDetector` API** where available, else a JS library (**ZXing / html5-qrcode**) over `getUserMedia`. Functionally: open camera, decode continuously, return the first decoded string, close. **Always** keep the manual-entry fallback (desktops often lack a camera / deny permission). Reproduce the 1:1 gradient-framed viewport and animated scan line for parity.

#### 6.5.3 Manual validation form (`/validate`)
App bar title **"Manual Product Registration"**, right **✕ close** (→ back to scanner). Three **required** fields:

| Field | Label / hint | Constraints & exact error messages |
|---|---|---|
| Serial Number | `"Serial Number"` `" (e.g. 123456)"`, hint `"Enter 6-digit serial"` | numeric, **exactly 6 digits**. Empty → `"Serial number is required"`; length ≠ 6 → `"Serial number must be 6 digits"`; non-numeric → `"Serial number must contain only numbers"`. |
| Build Date | `"Build Date"` `" (MM/YYYY)"`, hint `"e.g., 07/2025"` | format `MM/YYYY` (regex `^(0[1-9]|1[0-2])/\d{4}$`). Empty → `"Build date is required"`; bad format → `"Build date must be in MM/YYYY format"`. |
| Batch Number | `"Batch Number"` `" (e.g. 12345)"`, hint `"Enter last 5 digits"` | numeric, **exactly 5 digits**. Empty → `"Batch number is required"`; length ≠ 5 → `"Batch number must be 5 digits"`; non-numeric → `"Batch number must contain only numbers"`. |

- Submit: full-width gradient **"Register"** button (disabled while loading).
- On submit → `validateProductManual(serial, buildDate, batch)` (Odoo `stock.lot.get_product_expiry_info_v2`, arg order **[serial, batch, buildDate]**).
  - **Success** (`success == true|1|"true"` **or** `product_id != null`): cache the result as `validatedProduct` (keyed by serial), set `productScanned = serial`, navigate to the **post-scan detail** (which shows expiry + a Save action).
  - **Failure:** red snackbar title **"Invalid Information"**, message = backend `message` ?? **"The entered information does not match our records"** (4s).
  - **Exception:** red snackbar **"Error"** / `"An error occurred during validation: {e}"`.

#### 6.5.4 Post-scan / post-validate detail (`ScannedProductDetails`)
Container (`/product`) app bar title toggles **"Product Details"** (when a serial is present) / **"Product Registration"** (when empty). When a serial is present it shows header **"Scanned Product: "** + the code (the displayed code is trimmed, and if ≥ 15 characters truncated to the first 15 + `"..."`), then fetches details (`getProductDetails(serial)`), preferring the cached `validatedProduct` if its serial matches.

Detail card:
- **Invalid** (`expired_date == null`): red text **"Not a Valid Serial Number"**.
- **Valid** (`expired_date != null`): rows —
  - `display_name` (no label)
  - **"Serial No"** → `serial`
  - **"Batch No"** → `batch_number` (hidden if empty)
  - **"Manufacturing Date"** → `"{manufacturing_month}/{year}"` (each `avoidFalse` → `"--"`)
  - **"Expiry Date"** → `expired_date` formatted `dd MMMM yyyy`
  - **Actions:** **"Save Product"** + **"Cancel"**.
    - Save → `addProduct` (dup-guard on serial): if new → persist to Firestore `users/{uid}/products/{serial}`, add to list, go to Product tab, toast **"Product added successfully"**; if duplicate → error toast **"serial {serial} already exists"**.
    - Cancel → back.
- If the backend returns an `error` string, render it directly instead of the card.

#### 6.5.5 Saved product details (`ProductDetailsView`)
Opened via **"View Details"**. App bar **"Product Details"**. Layout: product image (base64, else `gloves`); info card with rows `display_name`, **"Batch Number : "**, **"Serial Number : "**; separate expiry card **"Expiry Date:       "** (`dd MMMM yyyy`, or **"Invalid Product"** on parse failure). Bottom **"Remove Item"** (red, bold) → confirm dialog title **"Sure to remove"**, content = product name, **"OK"** → `removeProduct` (delete from Firestore + list) → back to Home → toast **"Item Removed"**.

**Product actions are limited to:** View Details, Save Product, Cancel, Register, Remove Item. **No favourite/share/validate buttons on product screens** (favourite/like/share belong to the feed only).

---

### 6.6 Profile / Account

**Route:** Account tab (index 3). App bar title **"User Profile"** (no back arrow). An **edit toggle** (pencil icon) flips fields to editable and reveals a photo-change badge + a Save button; while editing the app-bar action becomes **"Cancel"**.

**Sections (top→bottom):**
1. **Profile card** — real-time from Firestore `users/{uid}` (snapshot):
   - **Avatar** (circle, 150px): `photoURL` (network, cached) or bundled `user.png` if none; while editing, an **add-photo badge** opens a picker; during upload show a **circular progress** with live **`{percent}%`**.
   - **Name** field — `"Name"`, editable in edit mode (clearable).
   - **Email** field — `"Email"`; **editability is provider-aware**: for `email`/`google.com`/`apple.com`/`password` providers it's editable **only if currently empty** (you can set one if missing, not change an existing one); for other providers it follows edit mode. *(Note: the email **write is commented out** in source — the field shows but saving email does nothing today. Decide whether to enable a real write on web.)*
   - **Phone** field — `"Phone"`; **not editable** for phone-auth users; otherwise follows edit mode.
   - **"SAVE"** button (edit mode) → writes name (`updateDisplayName` + Firestore `displayName`), phone (Firestore `phoneNumber`), and photo (upload to Storage `images/{uid}` → `getDownloadURL` → `updatePhotoURL` + Firestore `photoURL`); progress bar labeled **"Saving Profile..."**; success toast **"Profile Updated"**.
2. **"Log Out"** row (icon + label) → confirm dialog title **"Log out"**, content **"Sure to Log out from app?"**, **"OK"** → sign out → `/login`.
3. **App version** (read-only, right-aligned, faded): **"App Version {version} ({build})"** (e.g. `App Version 1.0.28 (45)`); on web pull from `package.json`/env.
4. **"Delete Account?"** row (red, centered card) → confirm dialog title **"Account Deletion"**, content **"This action may permanently delete your account and all data Inside it. This cannot be undone"**, confirm button **"I am Sure"** → delete the Firebase Auth user → toast **"Your account Has been deleted"** → `/login`. Progress label **"Deleting Profile..."**.
   - If delete fails with `requires-recent-login` → dialog title **"Please Verify Your Identity"**, content *"For your security, you need to log in again before you can delete your account. After logging in, please return to this screen and tap "Delete Account" again to complete the process."*, button **"Log in Again"** → sign out → `/login`.
   - *(Source deletes only the Auth account, not the Firestore/Storage data — a known TODO; on web you may also clean up `users/{uid}` and `images/{uid}`.)*

**Photo picker:** bottom sheet titled **"Profile Photo"** with **"Camera"** and **"Gallery"** options (image quality compressed to ~15%). On web: a single file input (`accept="image/*"`, optionally `capture` for camera on mobile browsers) covers both.

**Hidden/dead (do not build):** a "Settings"/"Notifications" list block exists but is `visible:false`. There is **no** change-password, language, theme toggle, about, help, terms, or support screen.

---

### 6.7 Push notifications

**Purpose:** broadcast + targeted push, with deep-linking into posts.

- Init after first render: request permission; subscribe to FCM topic **`all_users`**. On web use a service worker (`firebase-messaging-sw.js`) + VAPID key.
- **Foreground message:** show a custom top toast/banner: bell icon + title (`notification.title` ?? "New update") + body (or "Tap to view") + a chevron. Tapping it triggers navigation (below). Auto-dismiss ~4s.
- **Notification tap / background open → navigation:**
  - Extract a post id: for `event == "social.stream.post.notify"` use `stream_post_id`; for `event == "social.post.published"` use `live_post_id` ?? `post_id`; else try any of `stream_post_id`/`live_post_id`/`post_id`.
  - If a **post id** resolved → go to Home tab, ensure feed loaded, **scroll to that post** (retry a few times; if not found, toast **"Post not found"**).
  - Else if it's a social event → go to Home tab and refresh the feed.
  - Else if `target_url` present → **open that URL externally**.

---

## 7. Cross-cutting UI: states, dialogs, toasts, helpers

- **Loading:** brand `LoaderView` (logo shimmer) for full-screen/overlay; **5 skeleton cards** for feed/list loading.
- **Empty states:** always an image + a message + a tappable action (see each feature for exact strings/images).
- **Error states:** the Lottie **error dialog** for hard errors; inline messages for validation; toasts for soft failures. Network failure text: **"Failed to connect to internet, please try again"**.
- **Confirm dialogs:** iOS-style; used for logout, delete account, remove product, privacy.
- **Relative time:** compact (`now`, `2m`, `3h`, `4d`, `5mo`, `1y`).
- **Linkify:** turn URLs in post text into new-tab links; open all external links in a new tab.
- **Images:** Odoo `image_128` is base64 → render as `data:` URL; if `"false"`/empty use the bundled placeholder; network images should show a loading state and a broken-image fallback. SVG URLs get a placeholder.
- **Odoo `false` sentinels:** display via `avoidFalse` → `"--"`.

---

## 8. Web-specific adaptations

1. **Responsive layout / breakpoints (must):**
   - **Phone (< 640px):** single-column, mobile parity; **bottom pill nav**.
   - **Tablet (640–1024px):** constrain the feed to a readable column (~600px) centered; product list can go 2-up.
   - **Desktop (> 1024px):** move navigation to a **top bar or left sidebar** (same 4 destinations, labels, Account badge); feed centered ~600px; products in a responsive grid (2–4 columns); details screens can use a two-pane layout. Keep all functionality identical.
   - The mobile app supports portrait **and** landscape — ensure fluid reflow, no fixed pixel heights that clip.
2. **QR scanning:** `BarcodeDetector` API / ZXing / html5-qrcode over `getUserMedia`; graceful permission handling; **manual entry always available** as fallback.
3. **Routing:** real URLs per tab and per detail; support browser back/forward, refresh, and deep links (including the auth `?redirect=` return flow and notification deep-links `?post=<id>`).
4. **Media/share:** OS share sheet → **Web Share API** with copy-link fallback; YouTube via `youtube-nocookie` iframe embeds.
5. **Push:** FCM web (service worker + VAPID); handle permission denial gracefully.
6. **Storage of cache/session:** SharedPreferences → `localStorage`/IndexedDB (Odoo 6-hour cache, session cookie handling, any "seen" flags).
7. **Firebase config:** supply the web app's Firebase config; enable Google/Apple providers in Firebase Auth for the web domain; add authorized domains.
8. **Accessibility (add — the mobile app is thin here):** semantic headings, labelled inputs, focus states, keyboard navigation, alt text, adequate contrast (the monochrome palette helps).
9. **Feed image authentication (required — see §4.2):** the mobile app loads Odoo stream-post images by attaching `Cookie: frontend_lang=en_AU; session_id=<sid>` to each image request. Browsers cannot set a `Cookie` header on cross-origin `<img>` requests, so on web either (a) proxy feed images through a same-origin Next.js route that holds the Odoo session server-side (recommended — pairs naturally with the BFF option in §1's security note), or (b) make the Odoo post images publicly readable. Without one of these, feed images will 404/redirect for web users.

---

## 9. Out of scope / vestigial code — do NOT build

These exist in the mobile source but are unused, hidden, or template leftovers. **Do not port them** unless intentionally adding scope:
- **Phone / OTP auth** — controller has phone/OTP fields and a `loginWithPhone` stub, but **no UI is wired**; the country-code JSON read is commented out.
- **Local Floor/SQLite DB** (`EVSafeLocalDB`, `LocalDao`, `AppUser` entity) — all DAO queries are commented out; real caching is via SharedPreferences. (No web equivalent needed.)
- **Odoo HR/POS boilerplate** in `module_config.dart` (`hr.employee`, `hr.attendance`, `pos.order` order builders) — unrelated template code.
- **Hidden widgets:** the notification bell on Home; the "Settings"/"Notifications" rows on Profile; a legacy Material `BottomNavigationBar`; various `visible:false` blocks.
- **`getSocialPosts()` (`social.post`)** — the Home feed uses `getSocialStreamPosts()` (`social.stream.post`); the `social.post` variant is alternate/legacy (keep only if you need it).
- **`fakeimg.pl` avatar placeholder** — a bug; render the real author/logo image instead.
- **Debug page** (`DebugView`) — an internal HTTP-inspection screen reachable from verbose error toasts; optional dev-only tool, not a user feature.
- **Dark theme** — defined but the app ships light only (`darkTheme` is set to the light theme). Build light; dark is optional.

---

## 10. Acceptance checklist

**Auth**
- [ ] Sign in / sign up / reset in one screen with mode-swap; exact strings & inline vs toast error placement.
- [ ] Google + Apple (Apple feature-detected/hidden when unavailable).
- [ ] Auth guard + `?redirect=` return flow; user doc upserted on first login.

**Shell & feed**
- [ ] 4-tab shell with correct labels/icons/active-chip styling + Account badge.
- [ ] Home feed renders post cards (author, time-ago, message with see-more + linkify + search highlight, YouTube/collage media, like count, Favourite/Like/Share actions).
- [ ] Feed images load via a same-origin proxy (or public Odoo images) — §8.9.
- [ ] Client-side search + clear; empty/loading/error states with exact strings & images.
- [ ] Like toggles `post_likes`; Favourite toggles `users/{uid}/posts`; toasts correct.

**Favourites**
- [ ] Shows favourited posts; un-favourite removes card; empty state → Home.

**Products**
- [ ] List with count header, product cards, empty state, register buttons.
- [ ] Scanner (with manual fallback) returns a serial; post-scan detail shows valid vs "Not a Valid Serial Number".
- [ ] Manual validation form with exact field rules/messages; success → detail + Save.
- [ ] Save persists to Firestore (`products/{serial}`), dup-guard; Remove deletes + toast.
- [ ] Validity gate = non-null `expired_date`.

**Profile**
- [ ] Real-time profile from Firestore; provider-aware edit rules; photo upload w/ progress; save name/phone/photo.
- [ ] Logout, delete account (+ re-auth path), app version.

**Backend**
- [ ] Firebase (Auth/Firestore/Storage/Remote Config/FCM) wired.
- [ ] Odoo JSON-RPC: authenticate + the 5 methods; 6-hour cache implemented as *intended* (not the broken mobile version — §4.4); `false` sentinel handling; session-expiry re-auth (a fix over the mobile no-op — §4.2).

**Web**
- [ ] Fully responsive (phone → desktop) with adapted nav; browser back/refresh/deep-links; push permission handled; accessible.

---

## Revision log

**2026-07-15 — verification pass against the mobile source (`lib/`), corrections applied:**
- §2.1: `textColorProfile`/`textColorProfilePhone` resolve to `#0C111D` in the shipped light theme (the grey values are dark-mode-only branches).
- §2.4: documented the compact relative-time quirks (`~1h` → minutes, `~1d` → `{d}d {h}h`, `~1mo` → days).
- §4.2: the Odoo session cookie is **not** sent on `/jsonrpc` calls (they authenticate via payload args); its real use is feed image requests. Session-expiry (code 100) handling in mobile is a no-op — web should implement real re-auth. Added the feed-image cookie-auth requirement.
- §4.3: stream-post image URLs are used as returned (no `baseUrl` prefix) and need session auth.
- §4.4: the 6-hour cache is **broken in mobile** (timestamp written under `{<key>}_time` with literal braces, read back from `<key>_time`) — effective behaviour is network-first with cache as failure fallback; web should build the intended TTL.
- §6.1: `wrong-password` inline error is the humanised code ("Wrong Password"); added reset-mode error mapping.
- §6.3: the feed action row renders **three** actions — Favourite, Like, **Share** (share sheet with the post message text).
- §6.5: registration container's manual card is labelled "Manual Product Validation" (scanner screen's card says "Manual Product Registration"); "Scanned Product:" header truncates the code at 15 chars + "...".
- §8: added item 9 (same-origin image proxy for feed images); checklist updated accordingly.

**2026-07-15 — brand-assets integration:**
- Added §2.6 documenting the official eVehicleSafe brand identity from the repo's new `brand-assets/` folder (Logo/Brand Guidelines v1.0, April 2025, by 5818 Digital): logo system (long wordmark + short "e" Options 1/2, four colourways each, RGB/CMYK packs), official palette (eVS Blue `#558CC8`, eVS Teal `#41BEB4`, 45° gradient, Black/Grey/Light Grey), Nunito typeface (Arial Rounded fallback), and clear-space/minimum-size/usage rules.
- Noted that production SVG gradient stops are `#578ECA → #3CBDB2` (differ slightly from the guide's hexes) and that the app's `evsafe_long.png` is byte-identical to the brand pack's long full-colour-black PNG — web should use the SVGs.
- §2 intro + §2.5 updated to frame in-app UI tokens vs official brand identity, with four flagged conflicts/decisions (gradient button colours, loader shimmer, Inter vs Nunito, monochrome UI chrome vs brand palette).

*End of specification.*
