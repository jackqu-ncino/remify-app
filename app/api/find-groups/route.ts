export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

function buildFindGroupsEmail(opts: {
  email: string
  ownedGroups: { name: string; token: string }[]
  subscribedGroups: { name: string; token: string }[]
  appUrl: string
}): string {
  const { ownedGroups, subscribedGroups, appUrl } = opts

  const groupRow = (g: { name: string; token: string }) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f3f4f6;">
        <a href="${appUrl}/group/${g.token}"
           style="font-size:15px;font-weight:600;color:#3B0764;text-decoration:none;">
          ${g.name}
        </a>
        <br>
        <a href="${appUrl}/group/${g.token}"
           style="font-size:12px;color:#a82dd6;text-decoration:none;">
          ${appUrl}/group/${g.token} →
        </a>
      </td>
    </tr>`

  const ownedSection = ownedGroups.length > 0 ? `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">
      Groups you created
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${ownedGroups.map(groupRow).join('')}
    </table>` : ''

  const subscribedSection = subscribedGroups.length > 0 ? `
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;">
      Groups you follow
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      ${subscribedGroups.map(groupRow).join('')}
    </table>` : ''

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Remify groups</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3B0764;padding:32px 32px 24px;">
              <p style="margin:0;font-size:32px;">🔗</p>
              <h1 style="margin:12px 0 0;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                Your Remify groups
              </h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">
                Here are all the groups linked to your email
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              ${ownedSection}
              ${subscribedSection}
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
                Bookmark your group link so you can always find it quickly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                remify.app · Never miss what matters most
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

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = supabaseAdmin()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://remify.app'

    // Groups this email created (active only)
    const { data: ownedRaw } = await db
      .from('groups')
      .select('name, token')
      .eq('owner_email', normalizedEmail)
      .eq('status', 'active')

    const ownedGroups = ownedRaw ?? []
    const ownedTokens = new Set(ownedGroups.map(g => g.token))

    // Groups this email subscribed to (exclude ones they own to avoid dupes)
    const { data: subRaw } = await db
      .from('subscribers')
      .select('groups(name, token, status)')
      .eq('email', normalizedEmail)

    const subscribedGroups = (subRaw ?? [])
      .map((row: any) => row.groups)
      .filter((g: any) => g && g.status === 'active' && !ownedTokens.has(g.token))

    // Always respond with success — don't reveal whether email exists
    // Only send email if there's something to send
    if (ownedGroups.length > 0 || subscribedGroups.length > 0) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: `Remify <${process.env.RESEND_FROM_EMAIL ?? 'reminders@remify.app'}>`,
        to: normalizedEmail,
        subject: 'Your Remify group links',
        html: buildFindGroupsEmail({
          email: normalizedEmail,
          ownedGroups,
          subscribedGroups,
          appUrl,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('POST /api/find-groups', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
