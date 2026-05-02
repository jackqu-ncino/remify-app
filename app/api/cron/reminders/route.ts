export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

const REMINDER_DAYS = [30, 10, 1] // days before the date

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    birthday:    'Birthday',
    anniversary: 'Anniversary',
    graduation:  'Graduation',
    wedding:     'Wedding',
    passing:     'Remembrance',
    other:       'Special Date',
  }
  return map[type] ?? 'Special Date'
}

function typeEmoji(type: string): string {
  const map: Record<string, string> = {
    birthday: '🎂', anniversary: '💍', graduation: '🎓',
    wedding: '💒', passing: '🕯️', other: '⭐',
  }
  return map[type] ?? '⭐'
}

function daysUntilNext(month: number, day: number, today: Date): number {
  const y = today.getFullYear()
  let next = new Date(y, month - 1, day)
  if (next < today) next = new Date(y + 1, month - 1, day)
  const diff = Math.round((next.getTime() - today.getTime()) / 86400000)
  return diff
}

function buildEmailHtml(opts: {
  recipientName: string
  groupName: string
  label: string
  type: string
  month: number
  day: number
  year: number | null
  note: string | null
  daysAway: number
  groupUrl: string
}): string {
  const { recipientName, groupName, label, type, month, day, year, note, daysAway, groupUrl } = opts
  const dateStr = `${MONTHS[month - 1]} ${day}${year ? `, ${year}` : ''}`

  let countdown = ''
  if (daysAway === 1) countdown = 'is <strong>tomorrow</strong>'
  else if (daysAway === 10) countdown = 'is <strong>10 days away</strong>'
  else if (daysAway === 30) countdown = 'is <strong>one month away</strong>'
  else countdown = `is in <strong>${daysAway} days</strong>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reminder: ${label}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#a82dd6,#7c3aed);padding:32px 32px 24px;">
              <p style="margin:0;font-size:32px;">${typeEmoji(type)}</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                ${label}
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">
                ${typeLabel(type)} · ${dateStr}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hi ${recipientName}, 👋
              </p>
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Just a reminder that <strong>${label}</strong> ${countdown}.
              </p>
              ${note ? `<div style="background:#faf5ff;border-left:3px solid #a82dd6;border-radius:4px;padding:12px 16px;margin:0 0 20px;">
                <p style="margin:0;color:#6b21a8;font-size:14px;font-style:italic;">"${note}"</p>
              </div>` : ''}
              <p style="margin:0 0 24px;color:#6b7280;font-size:14px;">
                From the <strong>${groupName}</strong> group
              </p>
              <a href="${groupUrl}" style="display:inline-block;background:#a82dd6;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
                View all dates →
              </a>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                You're receiving this because you subscribed to <strong>${groupName}</strong> reminders.<br>
                <a href="${groupUrl}" style="color:#a82dd6;text-decoration:none;">Manage subscription</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function GET(req: Request) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const db = supabaseAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://yourdomain.com'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let sent = 0
  let skipped = 0

  try {
    // Fetch all dates with their group and subscribers
    const { data: dates, error: dErr } = await db
      .from('dates')
      .select('id, label, type, month, day, year, note, group_id')

    if (dErr) throw dErr

    for (const d of dates ?? []) {
      const days = daysUntilNext(d.month, d.day, today)
      if (!REMINDER_DAYS.includes(days)) continue

      // Fetch the group for this date
      const { data: group, error: gErr } = await db
        .from('groups')
        .select('id, name, token')
        .eq('id', d.group_id)
        .single()

      if (gErr || !group) continue

      // Get subscribers for this group
      const { data: subs, error: sErr } = await db
        .from('subscribers')
        .select('name, email')
        .eq('group_id', group.id)

      if (sErr || !subs?.length) continue

      for (const sub of subs) {
        try {
          await resend.emails.send({
            from: `Remify <${process.env.RESEND_FROM_EMAIL ?? 'reminders@remify.app'}>`,
            to: sub.email,
            subject: `${typeEmoji(d.type)} Reminder: ${d.label} is ${days === 1 ? 'tomorrow!' : `${days} days away`}`,
            html: buildEmailHtml({
              recipientName: sub.name,
              groupName:     group.name,
              label:         d.label,
              type:          d.type,
              month:         d.month,
              day:           d.day,
              year:          d.year,
              note:          d.note,
              daysAway:      days,
              groupUrl:      `${appUrl}/group/${group.token}`,
            }),
          })
          sent++
        } catch (emailErr) {
          console.error(`Failed to send to ${sub.email}:`, emailErr)
          skipped++
        }
      }
    }

    return NextResponse.json({ ok: true, sent, skipped, checkedAt: today.toISOString() })
  } catch (err: any) {
    console.error('Cron error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
