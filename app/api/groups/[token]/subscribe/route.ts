export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Resend } from 'resend'

function buildWelcomeEmail(opts: {
  name: string
  groupName: string
  groupUrl: string
  unsubscribeUrl: string
}): string {
  const { name, groupName, groupUrl, unsubscribeUrl } = opts
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're subscribed to ${groupName}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 8px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3B0764;padding:32px 32px 24px;">
              <img src="https://remify.app/icon-email.png" width="40" height="40" alt="Remify" style="display:block;margin-bottom:16px;border-radius:10px;">
              <h1 style="margin:0 0 6px;color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;">
                You're subscribed!
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">
                ${groupName}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hi ${name}, 👋
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                You'll now receive email reminders for all important dates in <strong>${groupName}</strong> — 1 month, 10 days, and 1 day before each one.
              </p>
              <a href="${groupUrl}" style="display:inline-block;background:#3B0764;color:#ffffff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:10px;text-decoration:none;">
                View group dates →
              </a>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
                Bookmark this group link so you can always find it quickly.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;">
                You're receiving this because you subscribed to <strong>${groupName}</strong> reminders.<br>
                <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a>
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

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { name, email } = await req.json()
    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const db = supabaseAdmin()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://remify.app'

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id, name')
      .eq('token', params.token)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Upsert so re-subscribing with the same email just updates the name
    const { data: subscriber, error: subErr } = await db
      .from('subscribers')
      .upsert(
        { group_id: group.id, email: email.trim().toLowerCase(), name: name.trim() },
        { onConflict: 'group_id,email' }
      )
      .select('unsubscribe_token')
      .single()

    if (subErr) throw subErr

    // Send welcome email with group link and unsubscribe option
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: `Remify <${process.env.RESEND_FROM_EMAIL ?? 'reminders@remify.app'}>`,
      to: email.trim().toLowerCase(),
      subject: `You're subscribed to ${group.name}`,
      html: buildWelcomeEmail({
        name:           name.trim(),
        groupName:      group.name,
        groupUrl:       `${appUrl}/group/${params.token}`,
        unsubscribeUrl: `${appUrl}/unsubscribe/${subscriber.unsubscribe_token}`,
      }),
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('POST /api/groups/[token]/subscribe', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
