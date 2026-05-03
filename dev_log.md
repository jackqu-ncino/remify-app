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

## Session 4 — May 3, 2026

### Testing infrastructure fix
- Fixed failing Vitest test: `daysUntilNext` "returns 0 when date is today" — test was passing `new Date()` (with time component) causing midnight `next` to appear in the past and roll to next year; fixed by passing `startOfDay(new Date())` to match the function's default behaviour

### Edit dates
- Added `PATCH /api/dates/[id]` — same ownership auth pattern as DELETE (verifies date belongs to group via token), validates fields, updates row and returns updated record
- Added `EditDateModal` component to group page — pre-populated with existing date values, same UI as Add Date modal, calls PATCH on submit
- Updated `DateCard` to show pencil (edit) and trash (delete) icons side by side; pencil hover is brand purple, trash hover is red
- `GroupPage` tracks `editingDate` state; on save, card updates in-place and list re-sorts by next occurrence without a full refetch
