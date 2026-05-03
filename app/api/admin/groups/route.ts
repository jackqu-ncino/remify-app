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

  try {
    const db = supabaseAdmin()

    const { data, error } = await db
      .from('groups')
      .select(`
        id, name, token, status, owner_email, created_by, created_at,
        dates(count),
        subscribers(count)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    const rows = (data ?? []).map((g: any) => ({
      id:               g.id,
      name:             g.name,
      token:            g.token,
      status:           g.status,
      owner_email:      g.owner_email,
      created_by:       g.created_by,
      created_at:       g.created_at,
      date_count:       g.dates?.[0]?.count ?? 0,
      subscriber_count: g.subscribers?.[0]?.count ?? 0,
    }))

    return NextResponse.json(rows)
  } catch (err: any) {
    console.error('GET /api/admin/groups', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
