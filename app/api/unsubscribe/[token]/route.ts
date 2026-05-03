export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function DELETE(
  _req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const db = supabaseAdmin()

    const { data, error } = await db
      .from('subscribers')
      .delete()
      .eq('unsubscribe_token', params.token)
      .select('email, groups(name, token)')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Invalid or already used unsubscribe link' }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      groupName: (data as any).groups?.name ?? 'your group',
      groupToken: (data as any).groups?.token ?? null,
    })
  } catch (err: any) {
    console.error('DELETE /api/unsubscribe/[token]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
