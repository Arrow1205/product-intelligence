import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { TestDetail } from '@/components/tests/test-detail'

interface Props { params: Promise<{ productId: string; testId: string }> }

export default async function TestDetailPage({ params }: Props) {
  const { productId, testId } = await params
  const supabase = await createSupabaseServerClient()
  const [{ data: test }, { data: blocks }, { data: participants }] = await Promise.all([
    supabase.from('tests').select('*').eq('id', testId).eq('product_id', productId).single(),
    supabase.from('test_blocks').select('*').eq('test_id', testId).order('position'),
    supabase.from('test_participants').select('*').eq('test_id', testId).order('created_at', { ascending: false }),
  ])
  if (!test) notFound()
  return <TestDetail test={test} blocks={blocks ?? []} participants={participants ?? []} productId={productId} />
}
