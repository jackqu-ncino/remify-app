# Remify — Backlog

A running list of future features, improvements, and bugs to triage. Add items freely; revisit and prioritize as the app grows.

---

## Features

### Subscriber management
Users who subscribe to reminders have no way to see or manage their subscriptions across groups (e.g. unsubscribe, update email). Fine for now, but will become a need as usage grows.

### Paid tier — pricing and limits
Free tier is capped at 1 active group per email. The `email_tiers` table is built and flexible (limit stored per tier row, not hardcoded), so mechanics are ready. What's still needed:
- Decide on tier names, group limits, and pricing (e.g. Basic = 3 groups at $X/mo, Premium = 10 groups at $Y/mo)
- Integrate Stripe for payment and plan status tracking
- Build upgrade flow (prompt, payment page, confirmation)
- Enforce tier limits in group creation API based on active subscription

**Decision deferred:** Pricing and group limits intentionally left open until beta feedback clarifies what users actually need and what they'd pay for. Unlimited groups may not be necessary.

### Date range events
Users asked about adding a date range (e.g. wedding weekend, vacation) rather than a single day. Decided **not to build** — the reminder anchor is always the start date, so a range doesn't change reminder behaviour. The simpler alternative is a description/note field on date cards so people can convey duration in free text (e.g. "Wedding weekend — May 15–17"). See note field below.

### Note/description field on date cards
A short free-text note per date (e.g. "3-day wedding weekend", "flying out at 6am") would cover the date range use case and generally add useful context for group members. Low complexity, good UX value.

### Customizable reminder intervals
Currently reminders are hardcoded to 30, 10, and 1 day before each date. Allow subscribers or group owners to customize this — e.g. "remind me 1 week before" or "only remind me 1 day before."

### ~~Edit dates~~ ✓ Fixed

### Rename group
Group owners have no way to rename their group after it's created. A simple rename option on the group page (owner-only) would cover this.

### ~~Date ownership~~ ✓ Built
Agreed model:
- **Creator**: full access via manage URL — can add/edit/delete any date
- **Subscriber**: can add, edit, and delete their own dates only; no access to other subscribers' dates
- Public page becomes partially gated: edit/delete icons only appear on dates belonging to the current viewer

Implementation plan:
1. Supabase migration: `ALTER TABLE dates ADD COLUMN created_by_email text`
2. Subscribe flow: save email to `localStorage` key `remify-subscriber-email` after successful subscribe
3. Add Date: send `created_by_email` from localStorage in POST body; store in DB
4. Public group page: read localStorage email, show edit/delete icons only where `created_by_email` matches
5. API (`PATCH`/`DELETE /api/dates/[id]`): enforce ownership server-side — reject if `created_by_email` in request doesn't match DB row (owner bypass: accept requests coming via manage URL with valid `ownerSecret`)

### ~~Owner can delete their own group~~ ✓ Built

### ~~PWA support~~ ✓ Built

### One-time vs recurring events
Events like graduations and weddings roll over every year indefinitely. Owners should be able to mark a date as one-time so it stops appearing after it passes.

### Invite members by email
Right now the only way to share a group is to copy/send the group link manually. A built-in "invite by email" flow would lower the friction significantly for less tech-savvy users.

### ~~Admin interface~~ ✓ Built

---

## Bugs / Minor Issues

### ~~Expired verification token — no recovery path~~ ✓ Fixed

### ~~Pending groups not counted in free tier check~~ ✓ Fixed
### ~~`themeColor` metadata deprecation warning~~ ✓ Fixed

### Empty space below date cards
When a group has only a few dates, there's a noticeable empty gray area below the last card before the bottom of the screen. Low priority UX polish.
**Possible fix:** Add a subtle empty-state nudge (e.g. "Invite a friend to add more dates") or reduce bottom padding when the list is short.
