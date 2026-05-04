export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkSecret(req: Request) {
  return req.headers.get('x-admin-secret') === process.env.ADMIN_SECRET
}

// PATCH /api/admin/tiers/[id] — update tier, group_limit, or notes
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { tier, group_limit, notes } = await req.json()
  const db = supabaseAdmin()
  const { data, error } = await db
    .from('email_tiers')
    .update({
      ...(tier !== undefined     && { tier: tier.trim() }),
      ...(group_limit !== undefined && { group_limit: group_limit }),
      ...(notes !== undefined    && { notes: notes?.trim() || null }),
    })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/admin/tiers/[id] — remove a tier entry
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  if (!checkSecret(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const db = supabaseAdmin()
  const { error } = await db.from('email_tiers').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
