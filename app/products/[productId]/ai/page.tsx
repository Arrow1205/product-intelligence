import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { AiAnalysisCenter } from '@/components/ai/ai-analysis-center'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'AI Analysis' }

export default async function AiPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: analyses } = await supabase.from('ai_analyses').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  return <AiAnalysisCenter analyses={analyses ?? []} productId={productId} />
}
