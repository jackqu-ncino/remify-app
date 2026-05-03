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
