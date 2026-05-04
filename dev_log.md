# Remify — Dev Log

A chronological record of daily progress. Oldest first.

---

## Session 1 (prior)

### Infrastructure & setup
- Configured custom sending domain `reminders@remify.app` via Resend — removed old domain, added DNS records, verified
- Added display name format to all outbound emails: `Remify <reminders@remify.app>`
- Set up GitHub repo and connected to Vercel (auto-deploy blocked by Hobby plan; workaround: `vercel --prod --scope jackqu-projects`)
- Resolved CRON_SECRET mismatch between local `.env.local` and Vercel environment variables
- Security incident: `info_key.txt` containing live Resend API key and Supabase service role key was accidentally committed. Resolved by rotating both keys, adding file to `.gitignore`, and purging git history with `git filter-branch`

### Features built
- Email verification flow for group creation — groups created in `pending` state, verified via magic link, activated on click
- Freemium model: 1 active group per owner email enforced at creation time
- Auto-subscribes group creator to reminders on verification
- Verified cron job end-to-end: Supabase → cron at `0 9 * * *` UTC → Resend → Gmail inbox confirmed

### UI redesign
- New brand color system centered on `#3B0764` deep purple with full Tailwind ramp
- `RemifyIcon` — custom heart-outline + clock hands SVG used throughout
- Home page: deep purple hero, sentence-case headline at 30px, email field, "check your inbox" post-submit state
- Group page: sticky purple header, urgency-coded countdown badges (red/amber/purple/gray), verified and pending banners, Add Date modal, Subscribe modal, Share button with native share sheet on mobile
- Removed "Your name" field from Add Date modal — `createdBy` defaults to `'group member'`

---

## Session 2 — May 2, 2026

### Bug fixes
- Removed leftover `createdBy` reference in Add Date modal validation — would have caused a runtime crash when submitting
- Fixed verified banner reappearing on every page reload — strips `?verified=true` from URL immediately using `router.replace()`
- Bumped trash icon from `text-gray-200` → `text-gray-400` so it's visible on mobile

### Group page UI
- Swapped button order: "Add date" now leads, "Email me" follows on the right
- Restyled "Email me" to brand tint (`bg-brand-50 / border-brand-200 / text-brand-700`) — clearly secondary but visually intentional

### Group creation flow
- Re-submit with same email now handles pending groups gracefully: updates name silently and resends a fresh verification email if token is still valid; deletes stale record and starts fresh if token is expired

### Find my group
- Built `POST /api/find-groups` — looks up active owned groups and subscribed groups by email, sends one email with direct links to both; always returns generic success to avoid revealing whether email exists in system
- Added collapsible "Already have a group? Find it by email" section to home page
- Success message: *"If you've previously created or joined any groups, we'll send you the links now."*

---

## Session 3 — May 3, 2026

### CAN-SPAM compliance
- Added `unsubscribe_token UUID` column to `subscribers` table via Supabase migration (`gen_random_uuid()` default, UNIQUE constraint)
- Built `DELETE /api/unsubscribe/[token]` route — soft delete by token, returns group name + token for confirmation page
- Built `/unsubscribe/[token]` client page — one-click unsubscribe, three states: loading / success / invalid link
- Unsubscribe link added to all subscriber emails: welcome, reminders (×3), find-my-groups

### Welcome email
- Subscribe flow (`/api/groups/[token]/subscribe`) now sends a welcome email immediately on signup
- Welcome email includes: group link, what to expect, and unsubscribe footer — compliant from first touch

### Email template audit & standardisation
- Replaced `linear-gradient(135deg,#a82dd6,#7c3aed)` headers with flat `#3B0764` across all templates (verification, welcome, reminders, find-my-groups)
- Replaced emoji icons in email headers (🔗, 📅, etc.) with hosted PNG: `https://remify.app/icon-email.png`
- Generated 64×64 `icon-email.png` (deep purple rounded square + white heart-clock SVG) via cairosvg in sandbox, saved to `public/`
- Standardised button color to `#3B0764` across all templates
- Fixed reminder copy: "From **${groupName}**" (removed redundant "group")
- Find-my-groups email: replaced raw URLs with "Go to group →" buttons; added "You received this because you requested it" footer

### Email preview route
- Built `GET /api/preview-email?secret=CRON_SECRET` — renders all 6 email templates on one page using dummy data
- No emails sent; purely for visual QA of template changes without triggering real sends
- Removes need to manually trigger cron or subscribe flows just to check template appearance

### Infrastructure fixes
- Fixed Next.js `themeColor` deprecation warning: moved from `metadata` export → dedicated `viewport` export in `app/layout.tsx`
- Fixed free tier check to include `pending` groups: `.in('status', ['active', 'pending'])` — prevents gaming the limit by creating multiple unverified groups
- Added `.env.example` with comments explaining where to find each value (Supabase, Resend, Vercel cron secret)

### Testing infrastructure
- Extracted shared utility functions to `lib/utils.ts`: `daysUntilNext`, `typeEmoji`, `urgencyStyle`, `FREE_TIER_LIMIT`
- Set up Vitest with `vite-tsconfig-paths` (no React plugin — pure TS tests only)
- Wrote 13 unit tests in `__tests__/utils.test.ts` covering all three utility functions
- Wrote 8 tests in `__tests__/api/freeTier.test.ts` covering free tier enforcement and pending token expiry logic
- Resolved npm peer dep conflict: removed `@vitejs/plugin-react` (pulled Vite 7, conflicted with pinned `@types/node@20.12.7`); not needed for pure TS unit tests

### Process
- Lesson learned: walk the full E2E user journey before building any feature — prevents building flows with no entry/exit point
- Agreed: start a fresh chat each day; keep `dev_log.md` + `BACKLOG.md` as source of truth so new sessions can re-orient from files rather than conversation memory

---

## Session 7 — May 3, 2026

### Date ownership
- Supabase migration: `ALTER TABLE dates ADD COLUMN created_by_email text`
- `POST /api/groups/[token]/dates`: now accepts and stores `created_by_email`
- `PATCH /DELETE /api/dates/[id]`: ownership enforced server-side — allow if `ownerSecret` query param matches group's `owner_secret` (owner bypass), or `created_by_email` matches DB row (subscriber). Both the public page and manage page updated accordingly.
- Manage page (`/group/[token]/manage/[ownerSecret]`): all edit/delete calls now pass `ownerSecret` in the URL — owner always has full access.
- Public group page:
  - `AddDateModal` is now two-step: if no email in localStorage, prompts for email first ("Who are you?"), saves to `localStorage` key `remify-subscriber-email`, then shows the date form. If email already stored, skips straight to date form.
  - `SubscribeModal`: pre-fills email from localStorage and locks the field (shows "locked" badge). On successful subscribe, updates localStorage — handles typo correction naturally.
  - `DateCard`: edit/delete icons only rendered when `canEdit` is true (`created_by_email` matches localStorage email). Subscribers see icons only on their own dates.
  - PATCH/DELETE calls from public page pass `created_by_email` from localStorage for server-side verification.
- Note: file writes to paths containing `[brackets]` silently truncate on Windows — worked around using Python `pathlib.write_text()` in bash for those files going forward.

---

## Session 6 — May 3, 2026

### Email tier overrides (beta access + future paid tiers)
- Supabase migration: created `email_tiers` table — `id`, `email` (unique), `tier` (text), `group_limit` (int, nullable = unlimited), `notes`, `created_at`
- Updated `POST /api/groups` free tier check: looks up `email_tiers` first; uses that `group_limit` if found (null = unlimited), falls back to `FREE_TIER_LIMIT = 1` for everyone else
- Built `GET/POST /api/admin/tiers` and `PATCH/DELETE /api/admin/tiers/[id]` — all guarded by `x-admin-secret`
- Added **Tiers tab** to `/admin` page with: add-override form (email, tier dropdown, group limit, notes), list of all overrides with inline edit and remove, tier badges colour-coded by type (beta = purple, basic = blue, premium = amber)

---

## Session 4 — May 3, 2026

### Testing infrastructure fix
- Fixed failing Vitest test: `daysUntilNext` "returns 0 when date is today" — test was passing `new Date()` (with time component) causing midnight `next` to appear in the past and roll to next year; fixed by passing `startOfDay(new Date())` to match the function's default behaviour

### Edit dates
- Added `PATCH /api/dates/[id]` — same ownership auth pattern as DELETE (verifies date belongs to group via token), validates fields, updates row and returns updated record
- Added `EditDateModal` component to group page — pre-populated with existing date values, same UI as Add Date modal, calls PATCH on submit
- Updated `DateCard` to show pencil (edit) and trash (delete) icons side by side; pencil hover is brand purple, trash hover is red
- `GroupPage` tracks `editingDate` state; on save, card updates in-place and list re-sorts by next occurrence without a full refetch

### Inline delete confirmation
- Replaced `window.confirm()` on date card with an inline "Remove? Yes / No" prompt — no browser popup, stays on-brand
- Trash icon click transitions the card actions to the confirmation state; "No" resets back to normal icons

### Admin interface (`/admin`)
- Built password gate — `ADMIN_SECRET` env var checked on every API call via `x-admin-secret` header; no session storage, enter each visit
- `GET /api/admin/groups` — returns all groups with date + subscriber counts via Supabase nested count query
- `GET /api/admin/lookup` — email lookup returning owned groups and subscribed groups for a given email
- `DELETE /api/admin/groups/[id]` — hard delete group by id (cascades to dates and subscribers)
- `DELETE /api/admin/subscribers` — removes a subscriber by email + group token; updates subscriber count in the groups list in-place
- Admin page: stat cards (total, active, pending, subscribers), groups list with search by name/email, status filter tabs (All/Active/Pending), sort dropdown (newest, oldest, most dates, most subscribers, name A→Z), and email lookup with remove subscriber action
- Added `ADMIN_SECRET` to `.env.example` and Vercel environment variables

### Owner manage page (Approach B — separate URL)
- Added `owner_secret UUID` column to `groups` table via Supabase migration (`gen_random_uuid()` default)
- New groups get `owner_secret: randomUUID()` at creation in `POST /api/groups`
- Built `GET /api/groups/[token]/owner` — verifies `ownerSecret` query param, returns group + dates
- Built `DELETE /api/groups/[token]/owner` — verifies `ownerSecret` in body, hard deletes group (cascades to dates + subscribers)
- Updated verify route to redirect to `/group/[token]/manage/[ownerSecret]?verified=true` on first activation
- Updated find-groups email: owned groups now show "Manage group →" link (with `owner_secret` in URL) plus ⚠️ "Keep this link private" note; subscribed groups show regular "Go to group →"
- Built `/group/[token]/manage/[ownerSecret]` page — owner-only view with:
  - Persistent amber warning banner: "Owner view — keep this URL private. It gives full control over your group."
  - "Public view" button in header (opens public page in new tab)
  - Green verified banner on first arrival (`?verified=true`), auto-dismissed and URL cleaned
  - Full date management: Add, Edit (inline modal), Delete (inline confirm) — same UI as public page
  - Danger zone: "Delete this group" with inline "Are you sure? Yes, delete / Cancel" confirmation → redirects home on delete

### PWA support
- Generated `icon-180.png`, `icon-192.png`, `icon-512.png` from `icon-email.png` source using cairosvg — faithfully reproduces the outlined heart + clock hands design at larger sizes
- Updated `public/manifest.json`: corrected `theme_color` from `#a82dd6` → `#3B0764`
- Updated `app/layout.tsx`: `apple-touch-icon` now points to `icon-180.png` (correct Apple size)
- Built `InstallBanner` component on public group page:
  - Shows only on iOS Safari (detected via user agent — excludes Chrome, Firefox, Edge iOS)
  - Hidden if already running as standalone PWA (`navigator.standalone === true` or `display-mode: standalone`)
  - Dismissed permanently via `localStorage` key `remify-install-dismissed`
  - Instructions: "Tap Share → Add to Home Screen" with inline share icon
  - Android users get native browser install prompt automatically via manifest — no banner needed

---

## Session 5 — May 3, 2026

### Design discussion: date ownership model
- Decided the public group page should not be fully read-only — subscribers should be able to contribute and manage their own dates
- Agreed ownership model:
  1. **Creator (owner)** — full access via manage URL: add, edit, delete any date, delete the group
  2. **Subscriber** — can add, edit, and delete their own dates only; cannot touch other subscribers' dates
- Implementation approach agreed:
  - Add `created_by_email text` column to `dates` table (Supabase migration)
  - Store subscriber email in `localStorage` (`remify-subscriber-email`) when they subscribe
  - Public page reads localStorage to gate edit/delete icons — only show on dates where `created_by_email` matches
  - API routes (`PATCH`/`DELETE` on dates) must also enforce ownership server-side (localStorage is UI-only and spoofable)
  - Acknowledged tradeoff: localStorage identity is not cryptographically secure, but acceptable for a trusted family/friends app
- **Not yet built** — deferred to next session
