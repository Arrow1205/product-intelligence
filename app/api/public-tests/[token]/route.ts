import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const supabase = supabaseServer()

    const { data: test } = await supabase
      .from('tests')
      .select('*')
      .eq('public_token', token)
      .eq('status', 'published')
      .single()

    if (!test) return NextResponse.json({ error: 'Test not found' }, { status: 404 })

    const { data: rawBlocks } = await supabase
      .from('test_blocks')
      .select('id, block_type, position, config')
      .eq('test_id', test.id)
      .order('position', { ascending: true })

    // Omit config.expected_signal from each block before sending to participant
    const blocks = (rawBlocks ?? []).map(b => {
      const cfg = (b.config ?? {}) as Record<string, unknown>
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { expected_signal: _omit, ...safeConfig } = cfg
      return { ...b, config: safeConfig }
    })

    return NextResponse.json({ test: { ...test, blocks } })
  } catch (err) {
    console.error('public-tests GET error', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
