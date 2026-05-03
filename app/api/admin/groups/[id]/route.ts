export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

function checkSecret(req: Request): boolean {
  const secret = req.headers.get('x-admin-secret')
  return !!secret && secret === process.env.ADMIN_SECRET
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  if (!checkSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const db = supabaseAdmin()

    const { error } = await db
      .from('groups')
      .delete()
      .eq('id', params.id)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('DELETE /api/admin/groups/[id]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
