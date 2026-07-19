# EVSafe Web App — Additional Features & Functionalities

> **Purpose.** This file tracks features and functionalities for the **web app project** that go **beyond** the mobile-parity scope defined in [`WEB_APP_SPEC.md`](./WEB_APP_SPEC.md). The spec defines *what exists today* (parity); this file defines *what we want to add or change*. An AI coding agent or developer should treat entries here as scoped additions on top of the spec.
>
> **How to use.** Add one entry per feature using the template below, and add a row to the summary table. Keep the spec untouched — when a feature here ships and becomes permanent, fold it into `WEB_APP_SPEC.md` and mark it `Merged into spec` here.

---

## Summary table

| # | Feature | Priority | Status | Spec sections affected |
|---|---------|----------|--------|------------------------|
| F1 | Role model: existing `role` field on user profiles (`common` / `reseller` / `administrator`) | High | Proposed | §4.5, §5.1, §3.2 |
| F2 | Administrator panel: list all users (search / filter) | High | Proposed | new §6.8, §3.1 |
| F3 | Administrator: change a user's role | High | Proposed | new §6.8, §5.1 |
| F4 | Administrator: disable / enable a user (app-level) | Medium | Proposed | new §6.8, §3.2, §5.1 |
| F5 | Public landing page aligned with the eVehicleSafe business | High | Proposed | §3.1 (routes), §2.6 (brand), §8 |

**Priority:** High / Medium / Low  **Status:** Proposed → Approved → In progress → Done → Merged into spec (or Rejected)

---

## Feature entries

<!-- Copy the template below for each new feature. -->

### Template (copy me)

```markdown
### F<N>. <Feature name>

- **Priority:** High | Medium | Low
- **Status:** Proposed
- **Requested by / date:**
- **Affected screens / areas:** (e.g. Home feed, Products list, Profile, backend)
- **Spec sections affected:** (e.g. §6.5, §4.3 — or "new")

**Description**

What the feature does, from the user's point of view.

**Behaviour / requirements**

- Concrete, testable requirements (exact strings, states, edge cases where known).

**Backend / data impact**

- New Odoo methods, Firestore collections/fields, or third-party services needed. "None" if purely frontend.

**Notes / open questions**

- Anything unresolved.
```

---

### F1. Role model — existing `role` field on user profiles

- **Priority:** High
- **Status:** Proposed
- **Requested by / date:** Xyra / 2026-07-15
- **Affected screens / areas:** Auth flow, Firestore schema, security rules (prerequisite for F2–F4)
- **Spec sections affected:** §4.5 (`updateUser`), §5.1 (Firestore schema), §3.2 (guards)

**Description**

The `users` collection **already carries a `role` field** that defines each user's role. The web app must adopt it as the role model. Available values:

| Value | Meaning |
|---|---|
| `common` | Regular end user (default) |
| `reseller` | Reseller account (powers TBD — see open questions) |
| `administrator` | Full admin — can view all users and manage roles (F2–F4) |

**Behaviour / requirements**

- Read `role` from `users/{uid}`; values are exactly `"common" | "reseller" | "administrator"` (lowercase strings).
- **Missing-field handling:** the mobile app's user-doc upsert (§4.5) does *not* write `role`, so existing docs may lack it — treat a missing `role` as `"common"`.
- The web app's `handleLogin` upsert should write `role: "common"` explicitly for newly created user docs (never overwrite an existing doc's role — the upsert is already create-only per §4.5).
- The client reads the current user's own `role` at login and exposes it app-wide (e.g. `useCurrentRole()`); role-gated routes/UI re-check it on every load, not just at login.

**Backend / data impact**

- No backend server (decision: Firestore-only). **Firestore security rules are mandatory:**
  - A user may read/update their own doc but must **not** be able to write `role` (or `disabled`) on any doc — including their own (no self-promotion).
  - Only users whose own doc has `role == "administrator"` may write `role`/`disabled` on other docs, and may read the full `users` collection.
- Rules change is the security boundary — the client UI is not.

**Notes / open questions**

- What powers does `reseller` have vs `common` in the web app? Nothing is defined yet — reserved tier until specified (e.g. bulk product registration? viewing customers' registrations?).
- Decision recorded: role stored as a Firestore field, **not** a custom claim. Accepted trade-off: rules must be airtight since the client can attempt writes.
- Who maintains the first `administrator`? Set manually (Firebase console) if not already present — document the bootstrap step.
- Confirm whether any existing backend/process already writes `role` values, so the web upsert doesn't conflict with it.

---

### F2. Administrator panel — list all users

- **Priority:** High
- **Status:** Proposed
- **Requested by / date:** Xyra / 2026-07-15
- **Affected screens / areas:** New admin section (new route, e.g. `/admin/users`)
- **Spec sections affected:** new §6.8 (Admin), §3.1 (routes)

**Description**

As an **administrator**, I can see all users of the system in a dedicated, role-guarded panel.

**Behaviour / requirements**

- New route `/admin/users`, visible/accessible **only** when the signed-in user's `role == "administrator"` (hide the nav entry for everyone else; direct navigation redirects non-administrators to Home).
- Lists all docs in the `users` collection: avatar (`photoURL`), `displayName`, `email`, `phoneNumber`, auth provider (from `providerData`), created / last sign-in (from `metadata`), current `role`, and disabled state (F4).
- **Search:** by name or email (case-insensitive substring, client-side to match the app's existing search pattern).
- **Filter:** by `role` (`common` / `reseller` / `administrator`) and by auth provider.
- Standard states per spec conventions: 5 skeleton rows while loading; empty-search state reuses the "No match found" pattern (§6.3).
- Pagination or virtualised list once the collection grows (Firestore `limit` + cursor); simple full fetch is acceptable for v1.

**Backend / data impact**

- None beyond F1's security rules (administrator read access to the whole `users` collection).
- **Known limitation (accepted):** the list shows only users with a `users/{uid}` doc — i.e. anyone who has signed in at least once. Firebase Auth accounts that never completed a login upsert won't appear (listing raw Auth accounts requires the server-side Admin SDK, explicitly out of scope per decision).

**Notes / open questions**

- Should the panel appear as a 5th nav destination for administrators, or a link from the Account/Profile tab? *(suggest: link row on the Account tab, keeping the 4-tab shell intact)*

---

### F3. Administrator — change a user's role

- **Priority:** High
- **Status:** Proposed
- **Requested by / date:** Xyra / 2026-07-15
- **Affected screens / areas:** Admin panel (F2)
- **Spec sections affected:** new §6.8, §5.1

**Description**

As an **administrator**, I can change any user's role between `common`, `reseller`, and `administrator` from the user list.

**Behaviour / requirements**

- Each row exposes a role selector (dropdown) with the three values `common` / `reseller` / `administrator`.
- Changing a role asks for confirmation via the standard confirm dialog (§2.4), e.g. title `"Change user role"`, content `"{displayName || email} → {newRole}"`, then writes `role` to that user's doc.
- Optimistic UI update + success toast (`Snack.oK` pattern); on write failure, revert and show error toast.
- **Guard rail:** an administrator cannot change their **own** role (prevents locking everyone out by demoting the last administrator). Row selector disabled for self.
- The affected user picks up their new role on next app load / next role read.

**Backend / data impact**

- Covered by F1's rules: only administrators may write `role`.

**Notes / open questions**

- Should demoting the *last remaining* administrator (other than self, which is blocked) be prevented too? Client-side check suggested.

---

### F4. Administrator — disable / enable a user (app-level)

- **Priority:** Medium
- **Status:** Proposed
- **Requested by / date:** Xyra / 2026-07-15
- **Affected screens / areas:** Admin panel (F2), auth guard (§3.2)
- **Spec sections affected:** new §6.8, §3.2, §5.1

**Description**

As an **administrator**, I can block a user from using the app without deleting their account, and re-enable them later.

**Behaviour / requirements**

- Toggle per row → confirm dialog → writes `disabled: true|false` on `users/{uid}`.
- Enforcement: the auth guard / app shell reads the current user's own `disabled` flag; if `true`, sign the user out (or show a blocking "Your account has been disabled" screen) — on app load and on the realtime profile snapshot the Profile tab already uses.
- Disabled users are visually flagged in the admin list.
- An administrator cannot disable themself.

**Backend / data impact**

- `disabled` boolean on `users/{uid}` (default absent/false); write-restricted to administrators by F1's rules.
- **Honest limitation (accepted with the Firestore-only decision):** this is **app-level** enforcement, not a Firebase Auth disable. The user's auth token stays valid; a hostile client could still call Firebase APIs directly, so rules should also deny reads/writes for disabled users where practical. A true `auth.disabled` block requires the server-side Admin SDK — revisit if a backend is ever added (the spec's §1 BFF note).

**Notes / open questions**

- Exact blocking UX (sign-out vs blocking screen) — suggest blocking screen with a "Log Out" button.

---

### F5. Public landing page aligned with the eVehicleSafe business

- **Priority:** High
- **Status:** Proposed
- **Requested by / date:** Xyra / 2026-07-15
- **Affected screens / areas:** New public route (`/`), routing for the authenticated app, SEO/OG
- **Spec sections affected:** §3.1 (routes — currently maps `/` to the authenticated shell), §2.6 (brand identity), §8 (web adaptations)

**Description**

A public, unauthenticated landing page that presents the eVehicleSafe business and funnels visitors into the web app (sign up / log in) or the shop.

**Business context (researched 2026-07-15 — see sources below)**

- **eVehicleSafe** (legal entity in the app's privacy text: **PJCC Electric Vehicle Pty Ltd**), based at Unit 14, 140–148 Chesterville Road, **Moorabbin, VIC, Australia** · +61 407 551 601 · sales@evehiclesafe.com.
- Sells **EV electrical-safety PPE and equipment**: Class 0 / Arc / Composite **insulating gloves** certified to **AS/NZS standards** (~AUD $154), fingerless cotton inner gloves, glove kits, **"FIRE CLOAK" EV car fire blankets** for lithium-ion battery fires (~AUD $4,565) and mobile storage boxes.
- Products carry **certification expiry dates**; customers **register products through the eVehicleSafe app** for authenticity verification, compliance tracking, and audit records — supporting Australian workplace health & safety compliance. Positioning note the site uses: products "assist with electrical safety but do not eliminate all risk".
- Existing web presence: an Odoo-based e-commerce site at `evehiclesafe.com` with a shop, app-download CTA, and contact page.
- ⚠️ The **LinkedIn About page** (`linkedin.com/company/evehiclesafe/about/`) could not be read by automation (LinkedIn blocks robots; browser-extension session unavailable). The summary above comes from the company's public website. **Action: paste the LinkedIn "About" text into this entry to refine the messaging/tagline before copywriting.**

**Behaviour / requirements**

- **Route change vs spec:** `/` becomes the public landing page; the authenticated shell moves behind it (e.g. `/app` with tab routes, or `/` auto-redirects signed-in users into the shell). Update the §3.1 route table when implementing. The `?redirect=` auth flow (§3.2) must keep working.
- **Brand treatment per §2.6:** eVS gradient hero (45°, SVG-sampled stops), long wordmark SVG, Nunito for landing-page typography (this is exactly the "marketing-facing surface" where Nunito applies), short-logo favicon/OG.
- **Suggested section structure (top→bottom):**
  1. **Hero** — wordmark, headline on EV electrical safety, subline on certified PPE + product authentication, primary CTA **"Open the app"** (login/signup), secondary CTA **"Shop products"** → `evehiclesafe.com/shop` (external).
  2. **How it works** — 3–4 steps mirroring the app's core loop: *buy certified PPE → scan the QR / enter the serial → verify authenticity → track expiry & compliance*.
  3. **Product categories** — insulating gloves (AS/NZS Class 0), glove kits & cotton inners, EV fire blankets — each linking to the shop.
  4. **Why it matters** — EV high-voltage / battery-fire safety and WHS compliance angle; certification-expiry tracking for audits.
  5. **App promo** — screenshots of the feed/products/scanner; app-store badges (mobile app) + web-app CTA.
  6. **Footer** — contact details (address, phone, sales@evehiclesafe.com), Privacy Policy (reuse the §6.1 dialog text on a `/privacy` page), Terms link to `evehiclesafe.com/terms-conditions`, LinkedIn link, ABN/legal line for PJCC Electric Vehicle Pty Ltd.
- **SEO/OG:** proper `<title>`/meta description around EV safety PPE + product verification; OG image from `brand-assets` (`eVehicleSafe Header.png` or LinkedIn banner); sitemap + robots allowing the landing page while keeping app routes noindexed.
- Fully responsive per §8 breakpoints; accessible (semantic landmarks, contrast on gradient sections).

**Backend / data impact**

- None — static/SSG page (Next.js static route). No Firebase or Odoo calls on the landing page itself.

**Notes / open questions**

- Confirm final copy/tagline once the LinkedIn About text is pasted in (see action above).
- Should the landing page link the shop as external (`evehiclesafe.com`) or is e-commerce ever moving into this web app? (Assumed external for now.)
- Do we need a "For resellers" section/CTA once the `reseller` role (F1) gets defined powers?

**Sources:** [evehiclesafe.com](https://evehiclesafe.com/) · [shop](https://evehiclesafe.com/shop) · [terms & conditions](https://evehiclesafe.com/terms-conditions) · [contact](https://evehiclesafe.com/contactus)

---

*Add new entries above this line.*
