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

  // Resolve logo to a signed URL (1 year expiry) so the client never needs storage access
  let logoSignedUrl: string | null = null
  if (test.logo_url) {
    const { data: signed } = await supabase.storage.from('product-files').createSignedUrl(test.logo_url, 60 * 60 * 24 * 365)
    logoSignedUrl = signed?.signedUrl ?? null
  }

  const testData = {
    id: test.id,
    title: test.title,
    intro_text: test.intro_text,
    closing_text: test.closing_text,
    estimated_minutes: test.estimated_minutes,
    public_token: publicToken,
    logo_url: logoSignedUrl,
    bg_color: test.bg_color ?? null,
    blocks: safeBlocks,
  }

  return <ParticipantTest test={testData} />
}
