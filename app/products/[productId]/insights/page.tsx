import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { InsightsView } from '@/components/insights/insights-view'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'Insights' }

export default async function InsightsPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: insights } = await supabase.from('insights').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  return <InsightsView insights={insights ?? []} productId={productId} />
}
