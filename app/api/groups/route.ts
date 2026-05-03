export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { randomUUID } from 'crypto'
import { Resend } from 'resend'

const FREE_TIER_LIMIT = 1

function buildVerificationEmail(opts: {
  creatorName: string
  groupName: string
  verifyUrl: string
}): string {
  const { creatorName, groupName, verifyUrl } = opts
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Remify group</title>
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
                Confirm your group
              </h1>
              <p style="margin:0;color:rgba(255,255,255,0.7);font-size:14px;">
                One click to activate <strong>${groupName}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                Hi ${creatorName}, 👋
              </p>
              <p style="margin:0 0 24px;color:#374151;font-size:16px;line-height:1.6;">
                Click the button below to verify your email and activate your Remify group. This link expires in <strong>24 hours</strong>.
              </p>
              <a href="${verifyUrl}" style="display:inline-block;background:#a82dd6;color:#ffffff;font-weight:600;font-size:14px;padding:14px 28px;border-radius:10px;text-decoration:none;">
                Activate my group →
              </a>
              <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;">
                If you didn't create a group on Remify, you can safely ignore this email.
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
    const { name, creatorName, ownerEmail } = await req.json()

    if (!name?.trim() || !creatorName?.trim() || !ownerEmail?.trim()) {
      return NextResponse.json(
        { error: 'Group name, your name, and email are required' },
        { status: 400 }
      )
    }

    const email = ownerEmail.trim().toLowerCase()
    const db = supabaseAdmin()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://remify.app'

    // Check free tier limit — active AND pending groups count toward the limit
    const { count, error: countErr } = await db
      .from('groups')
      .select('id', { count: 'exact', head: true })
      .eq('owner_email', email)
      .in('status', ['active', 'pending'])

    if (countErr) throw countErr

    if ((count ?? 0) >= FREE_TIER_LIMIT) {
      return NextResponse.json(
        {
          error: `You've reached the free tier limit of ${FREE_TIER_LIMIT} group. Upgrade to create more.`,
          limitReached: true,
        },
        { status: 403 }
      )
    }

    // Check for an existing pending group with this email
    const { data: existingPending } = await db
      .from('groups')
      .select('id, token, verification_expires_at')
      .eq('owner_email', email)
      .eq('status', 'pending')
      .single()

    const resend = new Resend(process.env.RESEND_API_KEY)
    const newVerificationToken = randomUUID()
    const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    if (existingPending) {
      const isExpired = new Date(existingPending.verification_expires_at) < new Date()

      if (isExpired) {
        // Delete the stale pending group and fall through to create a fresh one
        await db.from('groups').delete().eq('id', existingPending.id)
      } else {
        // Valid pending group — update the name and resend with a fresh token + expiry
        const { data: updated, error: updateErr } = await db
          .from('groups')
          .update({
            name: name.trim(),
            created_by: creatorName.trim(),
            verification_token: newVerificationToken,
            verification_expires_at: newExpiresAt,
          })
          .eq('id', existingPending.id)
          .select()
          .single()

        if (updateErr) throw updateErr

        const verifyUrl = `${appUrl}/api/verify/${newVerificationToken}`
        await resend.emails.send({
          from: `Remify <${process.env.RESEND_FROM_EMAIL ?? 'reminders@remify.app'}>`,
          to: email,
          subject: `Activate your Remify group: ${name.trim()}`,
          html: buildVerificationEmail({
            creatorName: creatorName.trim(),
            groupName: name.trim(),
            verifyUrl,
          }),
        })

        return NextResponse.json({ token: updated.token, id: updated.id, pending: true })
      }
    }

    // Create a brand-new group in pending state
    const token = randomUUID().replace(/-/g, '').slice(0, 12)
    const verifyUrl = `${appUrl}/api/verify/${newVerificationToken}`

    const { data, error } = await db
      .from('groups')
      .insert({
        name: name.trim(),
        token,
        created_by: creatorName.trim(),
        owner_email: email,
        status: 'pending',
        verification_token: newVerificationToken,
        verification_expires_at: newExpiresAt,
      })
      .select()
      .single()

    if (error) throw error

    await resend.emails.send({
      from: `Remify <${process.env.RESEND_FROM_EMAIL ?? 'reminders@remify.app'}>`,
      to: email,
      subject: `Activate your Remify group: ${name.trim()}`,
      html: buildVerificationEmail({
        creatorName: creatorName.trim(),
        groupName: name.trim(),
        verifyUrl,
      }),
    })

    return NextResponse.json({ token: data.token, id: data.id, pending: true })
  } catch (err: any) {
    console.error('POST /api/groups', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
