export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { verificationToken: string } }
) {
  const db = supabaseAdmin()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://remify.app'
  const { verificationToken } = params

  // Look up the group by verification token
  const { data: group, error } = await db
    .from('groups')
    .select('id, token, name, owner_email, created_by, status, verification_expires_at, owner_secret')
    .eq('verification_token', verificationToken)
    .single()

  if (error || !group) {
    return NextResponse.redirect(`${appUrl}/?error=invalid_link`)
  }

  if (group.status === 'active') {
    // Already verified — just send them to the group
    return NextResponse.redirect(`${appUrl}/group/${group.token}?verified=already`)
  }

  // Check expiry
  if (new Date(group.verification_expires_at) < new Date()) {
    return NextResponse.redirect(`${appUrl}/?error=link_expired`)
  }

  // Activate the group
  const { error: updateErr } = await db
    .from('groups')
    .update({
      status: 'active',
      verification_token: null,      // one-time use — clear it
      verification_expires_at: null,
    })
    .eq('id', group.id)

  if (updateErr) {
    console.error('Failed to activate group:', updateErr)
    return NextResponse.redirect(`${appUrl}/?error=server_error`)
  }

  // Auto-subscribe the creator so they receive reminders too
  await db
    .from('subscribers')
    .upsert(
      {
        group_id: group.id,
        name: group.created_by,
        email: group.owner_email,
      },
      { onConflict: 'group_id,email', ignoreDuplicates: true }
    )

  return NextResponse.redirect(`${appUrl}/group/${group.token}/manage/${group.owner_secret}?verified=true`)
}
