# Remify — Backlog

A running list of future features, improvements, and bugs to triage. Add items freely; revisit and prioritize as the app grows.

---

## Features

### Subscriber management
Users who subscribe to reminders have no way to see or manage their subscriptions across groups (e.g. unsubscribe, update email). Fine for now, but will become a need as usage grows.

### Paid tier — pricing and limits
Free tier is capped at 1 active group per email. The `email_tiers` table is built and flexible (limit stored per tier row, not hardcoded), so the infrastructure is ready. What's still needed:
- Decide on tier names, group limits, and pricing (e.g. Basic = 3 groups at $X/mo, Premium = 10 groups at $Y/mo)
- Integrate Stripe for payment and plan status tracking
- Build upgrade flow (prompt, payment page, confirmation)

**Decision deferred:** Pricing and group limits intentionally left open until beta feedback clarifies what users actually need and what they'd pay for. Unlimited groups may not be necessary.

### Date range events
Decided **not to build** — the reminder anchor is always the start date, so a range doesn't change reminder behaviour. The simpler alternative is a description/note field on date cards. See below.

### Note/description field on date cards
A short free-text note per date (e.g. "3-day wedding weekend", "flying out at 6am") would cover the date range use case and generally add useful context for group members. Low complexity, good UX value.

### Timezone-aware reminder delivery
Reminders currently fire at a fixed UTC time (9 AM UTC), which lands at odd hours for many users. The goal is to deliver at **7:00 AM in each subscriber's local time zone**.

**Approach:** Run the cron hourly instead of daily. Auto-detect timezone from the browser (`Intl.DateTimeFormat().resolvedOptions().timeZone`) on subscribe and store it on the `subscribers` row. Each cron run only sends to subscribers whose local hour is 7, with a `last_reminded_on` date column for dedup.

**Blocker:** Hourly crons require Vercel Pro ($20/mo). Confirm plan before implementing.

Full implementation plan: `docs/timezone-reminders-plan.md`

### Customizable reminder intervals
Currently reminders are hardcoded to 30, 10, and 1 day before each date. Allow subscribers or group owners to customize this — e.g. "remind me 1 week before" or "only remind me 1 day before."

### Rename group
Group owners have no way to rename their group after it's created. A simple rename option on the manage page (owner-only) would cover this.

### One-time vs recurring events
Events like graduations and weddings roll over every year indefinitely. Owners should be able to mark a date as one-time so it stops appearing after it passes.

### Invite members by email
Right now the only way to share a group is to copy/send the group link manually. A built-in "invite by email" flow would lower the friction significantly for less tech-savvy users.

---

## Built

- ~~Edit dates~~ ✓
- ~~Owner can delete their own group~~ ✓
- ~~PWA support~~ ✓
- ~~Admin interface~~ ✓
- ~~Email tier overrides~~ ✓ — `email_tiers` table, admin Tiers tab, free tier check respects per-email limits
- ~~Date ownership~~ ✓ — subscribers identity via localStorage, edit/delete gated to own dates, server-side enforcement

---

## Bugs / Minor Issues

### ~~Expired verification token — no recovery path~~ ✓ Fixed
### ~~Pending groups not counted in free tier check~~ ✓ Fixed
### ~~`themeColor` metadata deprecation warning~~ ✓ Fixed

### Empty space below date cards
When a group has only a few dates, there's a noticeable empty gray area below the last card before the bottom of the screen. Low priority UX polish.
**Possible fix:** Add a subtle empty-state nudge (e.g. "Invite a friend to add more dates") or reduce bottom padding when the list is short.
