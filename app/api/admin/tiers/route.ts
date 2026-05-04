export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkSecret(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// GET /api/admin/tiers — list all tier entries
export async function GET(req: Request) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('email_tiers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/tiers — add a new tier entry
export async function POST(req: Request) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { email, tier, group_limit, notes } = await req.json()
  if (!email?.trim() || !tier?.trim()) {
    return NextResponse.json({ error: 'email and tier are required' }, { status: 400 })
  }
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('email_tiers')
    .insert({
      email: email.trim().toLowerCase(),
      tier: tier.trim(),
      group_limit: group_limit ?? null,
      notes: notes?.trim() || null,
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That email already has a tier.' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}
