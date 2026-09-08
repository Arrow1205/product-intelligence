import { notFound } from 'next/navigation'
import { ParticipantTest } from '@/components/tests/participant-test'
import { supabaseServer } from '@/lib/supabase/server'

interface Props { params: Promise<{ publicToken: string }> }

export default async function PublicTestPage({ params }: Props) {
  const { publicToken } = await params
  const supabase = supabaseServer()

  const { data: test } = await supabase
    .from('tests')
    .select('*')
    .eq('public_token', publicToken)
    .eq('status', 'published')
    .single()

  if (!test) notFound()

  const { data: blocks } = await supabase
    .from('test_blocks')
    .select('id, block_type, position, config')
    .eq('test_id', test.id)
    .order('position', { ascending: true })

  // Strip expected_signal from config
  const safeBlocks = (blocks ?? []).map(b => {
    const cfg = (b.config ?? {}) as Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { expected_signal: _omit, ...safeConfig } = cfg
    return { ...b, config: safeConfig as Record<string, unknown> }
  })

  const testData = {
    id: test.id,
    title: test.title,
    intro_text: test.intro_text,
    closing_text: test.closing_text,
    estimated_minutes: test.estimated_minutes,
    public_token: publicToken,
    blocks: safeBlocks,
  }

  return <ParticipantTest test={testData} />
}
