export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = supabaseAdmin()

    const { data: group, error: gErr } = await db
      .from('groups')
      .select()
      .eq('token', params.token)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { data: dates, error: dErr } = await db
      .from('dates')
      .select()
      .eq('group_id', group.id)
      .order('month')
      .order('day')

    if (dErr) throw dErr

    return NextResponse.json({ group, dates: dates ?? [] })
  } catch (err: any) {
    console.error('GET /api/groups/[token]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
