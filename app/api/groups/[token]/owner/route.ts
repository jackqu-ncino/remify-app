export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ── GET — verify owner secret and return group + dates ───────────────────────
export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  const { searchParams } = new URL(req.url)
  const ownerSecret = searchParams.get('ownerSecret')

  if (!ownerSecret) {
    return NextResponse.json({ error: 'Missing owner secret' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()

    const { data: group, error: gErr } = await db
      .from('groups')
      .select()
      .eq('token', params.token)
      .eq('owner_secret', ownerSecret)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Invalid owner link' }, { status: 403 })
    }

    const { data: dates, error: dErr } = await db
      .from('dates')
      .select()
      .eq('group_id', group.id)

    if (dErr) throw dErr

    return NextResponse.json({ group, dates: dates ?? [] })
  } catch (err: any) {
    console.error('GET /api/groups/[token]/owner', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// ── DELETE — verify owner secret and delete group ────────────────────────────
export async function DELETE(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { ownerSecret } = await req.json()

    if (!ownerSecret) {
      return NextResponse.json({ error: 'Missing owner secret' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id')
      .eq('token', params.token)
      .eq('owner_secret', ownerSecret)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Invalid owner link' }, { status: 403 })
    }

    const { error } = await db
      .from('groups')
      .delete()
      .eq('id', group.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/groups/[token]/owner', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
