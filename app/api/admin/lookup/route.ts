export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret')
  return !!secret && secret === process.env.ADMIN_SECRET
}

export async function GET(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')?.trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()

    // Groups owned by this email
    const { data: owned, error: oErr } = await db
      .from('groups')
      .select('name, token, status')
      .eq('owner_email', email)
      .order('created_at', { ascending: false })

    if (oErr) throw oErr

    // Groups this email is subscribed to
    const { data: subs, error: sErr } = await db
      .from('subscribers')
      .select('groups(name, token)')
      .eq('email', email)

    if (sErr) throw sErr

    const subscribed = (subs ?? []).map((s: any) => ({
      group_name: s.groups?.name ?? 'Unknown',
      token:      s.groups?.token ?? '',
    }))

    return NextResponse.json({ owned: owned ?? [], subscribed })
  } catch (err: any) {
    console.error('GET /api/admin/lookup', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
