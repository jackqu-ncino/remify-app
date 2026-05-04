export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const token       = searchParams.get('token')
    const ownerSecret = searchParams.get('ownerSecret')

    if (!token) {
      return NextResponse.json({ error: 'Missing group token' }, { status: 400 })
    }

    const { label, type, month, day, year, note, created_by_email } = await req.json()

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

    const { data: date, error: dErr } = await db
      .from('dates')
      .select('id, group_id, created_by_email')
      .eq('id', params.id)
      .single()

    if (dErr || !date) {
      return NextResponse.json({ error: 'Date not found' }, { status: 404 })
    }

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id, owner_secret')
      .eq('token', token)
      .eq('id', date.group_id)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const isOwner      = ownerSecret && ownerSecret === group.owner_secret
    const isSubscriber = created_by_email &&
                         date.created_by_email &&
                         created_by_email.toLowerCase() === date.created_by_email.toLowerCase()

    if (!isOwner && !isSubscriber) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data, error } = await db
      .from('dates')
      .update({
        label: label.trim(),
        type:  type || 'other',
        month: Number(month),
        day:   Number(day),
        year:  year ? Number(year) : null,
        note:  note?.trim() || null,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (err: any) {
    console.error('PATCH /api/dates/[id]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url)
    const token            = searchParams.get('token')
    const ownerSecret      = searchParams.get('ownerSecret')
    const created_by_email = searchParams.get('created_by_email')

    if (!token) {
      return NextResponse.json({ error: 'Missing group token' }, { status: 400 })
    }

    const db = supabaseAdmin()

    const { data: date, error: dErr } = await db
      .from('dates')
      .select('id, group_id, created_by_email')
      .eq('id', params.id)
      .single()

    if (dErr || !date) {
      return NextResponse.json({ error: 'Date not found' }, { status: 404 })
    }

    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id, owner_secret')
      .eq('token', token)
      .eq('id', date.group_id)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const isOwner      = ownerSecret && ownerSecret === group.owner_secret
    const isSubscriber = created_by_email &&
                         date.created_by_email &&
                         created_by_email.toLowerCase() === date.created_by_email.toLowerCase()

    if (!isOwner && !isSubscriber) {
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
