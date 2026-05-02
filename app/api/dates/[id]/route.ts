export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Missing group token' }, { status: 400 })
    }

    const db = supabaseAdmin()

    // Verify the date belongs to this group (security check)
    const { data: date, error: dErr } = await db
      .from('dates')
      .select('id, group_id')
      .eq('id', params.id)
      .single()

    if (dErr || !date) {
      return NextResponse.json({ error: 'Date not found' }, { status: 404 })
    }

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id')
      .eq('token', token)
      .eq('id', date.group_id)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { error } = await db.from('dates').delete().eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/dates/[id]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
