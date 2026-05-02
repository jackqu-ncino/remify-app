export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

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

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id')
      .eq('token', params.token)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Upsert so re-subscribing with the same email just updates the name
    const { error } = await db
      .from('subscribers')
      .upsert(
        { group_id: group.id, email: email.trim().toLowerCase(), name: name.trim() },
        { onConflict: 'group_id,email' }
      )

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('POST /api/groups/[token]/subscribe', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
