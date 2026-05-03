# Remify — Backlog

A running list of future features, improvements, and bugs to triage. Add items freely; revisit and prioritize as the app grows.

---

## Features

### Subscriber management
Users who subscribe to reminders have no way to see or manage their subscriptions across groups (e.g. unsubscribe, update email). Fine for now, but will become a need as usage grows.

### Unsubscribe link in reminder emails
CAN-SPAM compliance requires a way to opt out from every marketing/reminder email. Every outbound reminder should include a one-click unsubscribe link at the bottom.

### Paid tier — multiple groups per owner
Free tier is capped at 1 active group per email. A paid tier would lift this limit. Requires a payment integration (e.g. Stripe) and a way to track plan status per owner email.

### Customizable reminder intervals
Currently reminders are hardcoded to 30, 10, and 1 day before each date. Allow subscribers or group owners to customize this — e.g. "remind me 1 week before" or "only remind me 1 day before."

### Edit dates
Currently users can only add or delete dates — there's no way to edit an existing one (fix a typo, change the year, update a note). A simple edit flow on the date card would cover this.

### Invite members by email
Right now the only way to share a group is to copy/send the group link manually. A built-in "invite by email" flow would lower the friction significantly for less tech-savvy users.

### Admin interface
A password-protected admin page at `/admin` for internal use. Useful for monitoring the app's health, managing users and groups, and handling support issues without going directly into Supabase. Possible capabilities:
- View all groups (active, pending, date counts, subscriber counts)
- View and manage subscribers (look up by email, manually remove)
- Trigger the reminder cron manually for testing
- View recent email activity / errors
- Soft-delete or deactivate problematic groups

Access should be restricted to a hardcoded admin secret (env var) or a small allowlist of emails, not a full auth system.

---

## Bugs / Minor Issues

### Expired verification token — no recovery path
If a user's 24-hour verification link expires, they hit a dead end. There's no way to resend or regenerate the link. Fix: when the create form is submitted with an email that already has an expired pending group, delete the stale record and issue a fresh verification email. If the pending group is not yet expired, just resend the existing email.

### Pending groups not counted in free tier check
The free tier enforcement only queries `active` groups, not `pending` ones. Someone could submit the create form multiple times with the same email before verifying, resulting in multiple pending groups in the database.
**Fix:** Update the group creation check to count `active OR pending` groups.

### `themeColor` metadata deprecation warning
Next.js 14 emits a build warning: `Unsupported metadata themeColor is configured in metadata export`. It doesn't break anything but will become an error in a future Next.js version.
**Fix:** Move `themeColor` from the `metadata` export into a `viewport` export in `layout.tsx`.

### Empty space below date cards
When a group has only a few dates, there's a noticeable empty gray area below the last card before the bottom of the screen. Low priority UX polish.
**Possible fix:** Add a subtle empty-state nudge (e.g. "Invite a friend to add more dates") or reduce bottom padding when the list is short.
