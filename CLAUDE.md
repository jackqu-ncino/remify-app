# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is
Remify (remify.app) is a no-account date reminder app for groups of friends and families.
Users create a group with just an email + group name. No passwords, no sign-up flow.

## Stack
- **Framework:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Database:** Supabase — project ID: `antzgzrqatitezgpftva`
- **Email:** Resend — sender: `reminders@remify.app`
- **Hosting:** Vercel — project: `important-date-reminder` (team: `team_JrKZZBazQS0OORZ82xSj2jtI`)
- **Tests:** Vitest (`__tests__/`)

## Key Commands
```bash
npm run dev          # local dev server
npm run build        # production build
npm run test         # run full test suite (vitest run)
npm run test:watch   # watch mode
npm run lint         # lint

# Run a single test file
npx vitest run __tests__/api/freeTier.test.ts
```

## Environment Variables
Set locally via `set-env.ps1`. Required vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_APP_URL` — base URL (e.g. `https://remify.app`)
- `ADMIN_SECRET` — checked via `x-admin-secret` header on all `/api/admin/*` routes
- `CRON_SECRET` — checked via `Authorization: Bearer <secret>` on `/api/cron/reminders`
- `RESEND_FROM_EMAIL` — optional, defaults to `reminders@remify.app`

## Core Concepts

### Two Auth Mechanisms (no user accounts)
All authorization is token-based, embedded in URLs:

1. **`verification_token`** — one-time UUID in a magic link emailed on group creation. Hitting `/api/verify/[verificationToken]` activates the group, clears the token, and redirects to the owner view. Expires after 24 hours.

2. **`owner_secret`** — permanent UUID stored on the group. Embedded in the manage URL (`/group/[token]/manage/[ownerSecret]`) and checked server-side on every mutation (add/edit/delete dates, delete group). Keep this URL private — it grants full control.

The **public group token** (`token` column, 12-char alphanumeric) is safe to share; it only allows reads and subscribing.

### Group Lifecycle
1. User submits email + group name → group created in `pending` state, verification email sent
2. User clicks magic link → group becomes `active`, creator auto-subscribed, redirected to owner view
3. If a pending group for the same email already exists and hasn't expired, its name/token are updated and a fresh verification email is sent (no duplicate groups)

### Reminder Schedule
Cron fires daily at **9:00 AM UTC** (configured in `vercel.json`). Reminders fire at **30**, **10**, and **1** day(s) before each date. `daysUntilNext()` in `lib/utils.ts` is the canonical implementation (also duplicated in the cron route and manage page — keep in sync).

### Tier / Group Limit System
The `email_tiers` table maps emails to group limits. Resolution order:
- No row → free tier (1 group)
- Row with `group_limit = null` → unlimited
- Row with numeric `group_limit` → that many groups

Tiers are managed via `/admin` (Groups + Tiers tabs). Admin auth uses the `x-admin-secret` request header.

## Database Tables
- **`groups`** — `id`, `name`, `token` (public 12-char ID), `owner_email`, `created_by`, `status` (`pending`|`active`), `owner_secret` (UUID), `verification_token`, `verification_expires_at`
- **`dates`** — `id`, `label`, `type`, `month`, `day`, `year` (nullable), `note` (nullable), `group_id`
- **`subscribers`** — `id`, `group_id`, `name`, `email`, `unsubscribe_token`; unique on `(group_id, email)`
- **`email_tiers`** — `id`, `email`, `tier` (`beta`|`basic`|`premium`), `group_limit` (nullable int), `notes`, `created_at`

## Project Structure
```
app/
  page.tsx                            # Home — group creation + find-my-groups flow
  group/[token]/page.tsx              # Public group view (read-only + subscribe)
  group/[token]/manage/[ownerSecret]/ # Owner view — add/edit/delete dates, delete group
  admin/page.tsx                      # Admin dashboard (groups list + tier management)
  unsubscribe/[token]/page.tsx        # Unsubscribe confirmation page
  api/
    groups/route.ts                   # POST — create group
    groups/[token]/route.ts           # GET — fetch group + dates (public)
    groups/[token]/owner/route.ts     # GET/DELETE — owner-authenticated group ops
    groups/[token]/subscribe/route.ts # POST — subscribe to a group
    groups/[token]/dates/route.ts     # POST — add a date (any subscriber can add)
    dates/[id]/route.ts               # PATCH/DELETE — edit/delete a date (owner only)
    verify/[verificationToken]/route.ts # GET — activate group from magic link
    find-groups/route.ts              # POST — email user all their group links ("I lost my link")
    unsubscribe/[token]/route.ts      # POST — unsubscribe
    cron/reminders/route.ts           # GET — send reminder emails (cron-protected)
    admin/groups/route.ts             # GET — list all groups (admin)
    admin/groups/[id]/route.ts        # DELETE — admin delete group
    admin/subscribers/route.ts        # DELETE — admin remove subscriber
    admin/lookup/route.ts             # GET — look up groups by email (admin)
    admin/tiers/route.ts              # GET/POST — list/add tier overrides (admin)
    admin/tiers/[id]/route.ts         # PATCH/DELETE — edit/remove tier override (admin)
    preview-email/route.ts            # GET — preview email HTML in browser (dev)
lib/
  supabase.ts   # supabaseAdmin() for server routes; getSupabaseClient() for browser
  utils.ts      # EVENT_TYPES, daysUntilNext, typeEmoji, urgencyStyle, FREE_TIER_LIMIT
__tests__/      # Vitest tests (unit-level; no DB)
```

## Key Conventions
- All API routes use `supabaseAdmin()` (service role key) — the public anon client is never used server-side.
- Supabase clients are created lazily inside functions to avoid instantiation at build time.
- Email HTML is inline in each route file (no separate template system).
- Dates are stored as `(month, day, year?)` — year is optional and dates recur annually.
- Event types: `birthday`, `anniversary`, `graduation`, `wedding`, `passing`, `other`.
- The brand color is `#3B0764` (deep purple); Tailwind custom `brand-*` scale is used throughout.

## Monetization Model (Freemium)
- Free: 1 group per verified email
- Paid (future): unlimited groups — controlled via `email_tiers` table
- Groups are the monetization unit — keep this in mind when touching group creation logic

## Guiding Principles
- **No friction:** No accounts, no passwords. Email verification is the only identity layer.
- **Normal-people UX:** Before adding complexity, ask "would a non-technical person understand this?"
- **Mobile-first:** Primary users are families and friend groups on phones.
