import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { NeedDetail } from '@/components/needs/need-detail'

interface Props { params: Promise<{ productId: string; needId: string }> }

export default async function NeedDetailPage({ params }: Props) {
  const { productId, needId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: need } = await supabase.from('need_expressions').select('*').eq('id', needId).eq('product_id', productId).single()
  if (!need) notFound()
  const { data: analyses } = await supabase.from('ai_analyses').select('*').eq('source_id', needId).eq('analysis_type', 'need_analysis').order('created_at', { ascending: false })
  return <NeedDetail need={need} analyses={analyses ?? []} productId={productId} />
}
