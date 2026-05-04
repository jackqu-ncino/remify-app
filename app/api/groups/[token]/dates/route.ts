export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { label, type, month, day, year, note, createdBy, created_by_email } = await req.json()

    if (!label?.trim() || !month || !day) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (month < 1 || month > 12) {
      return NextResponse.json({ error: 'Invalid month' }, { status: 400 })
    }
    if (day < 1 || day > 31) {
      return NextResponse.json({ error: 'Invalid day' }, { status: 400 })
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

    const { data, error } = await db
      .from('dates')
      .insert({
        group_id:         group.id,
        label:            label.trim(),
        type:             type || 'other',
        month:            Number(month),
        day:              Number(day),
        year:             year ? Number(year) : null,
        note:             note?.trim() || null,
        created_by:       createdBy?.trim() || 'group member',
        created_by_email: created_by_email?.trim().toLowerCase() || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/groups/[token]/dates', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
