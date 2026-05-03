# Remify — Backlog

A running list of future features, improvements, and bugs to triage. Add items freely; revisit and prioritize as the app grows.

---

## Features

### Subscriber management
Users who subscribe to reminders have no way to see or manage their subscriptions across groups (e.g. unsubscribe, update email). Fine for now, but will become a need as usage grows.

### Paid tier — multiple groups per owner
Free tier is capped at 1 active group per email. A paid tier would lift this limit. Requires a payment integration (e.g. Stripe) and a way to track plan status per owner email.

### Customizable reminder intervals
Currently reminders are hardcoded to 30, 10, and 1 day before each date. Allow subscribers or group owners to customize this — e.g. "remind me 1 week before" or "only remind me 1 day before."

### ~~Edit dates~~ ✓ Fixed

### Rename group
Group owners have no way to rename their group after it's created. A simple rename option on the group page (owner-only) would cover this.

### Owner-only actions
Anyone with the group link can currently add, edit, and delete dates. Only the verified group owner should be able to manage dates. Requires a mechanism to identify the owner on the group page without a full login system.

### Owner can delete their own group
Currently only admin can delete groups. The owner should be able to delete their own group from the group page.

### PWA support
Add a web app manifest and icons so users can install Remify to their iPhone/Android home screen for a native app-like experience. No App Store required — works via "Add to Home Screen" in Safari. Prerequisite for any future monetization via Stripe (avoids Apple's 30% IAP cut).

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
