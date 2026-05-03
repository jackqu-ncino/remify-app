export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret')
  return !!secret && secret === process.env.ADMIN_SECRET
}

export async function DELETE(req: Request) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const email       = searchParams.get('email')?.trim().toLowerCase()
  const groupToken  = searchParams.get('group_token')?.trim()

  if (!email || !groupToken) {
    return NextResponse.json({ error: 'Missing email or group_token' }, { status: 400 })
  }

  try {
    const db = supabaseAdmin()

    // Resolve token → group id
    const { data: group, error: gErr } = await db
      .from('groups')
      .select('id')
      .eq('token', groupToken)
      .single()

    if (gErr || !group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    const { error } = await db
      .from('subscribers')
      .delete()
      .eq('group_id', group.id)
      .eq('email', email)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/admin/subscribers', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
