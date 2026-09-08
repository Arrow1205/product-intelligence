import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { PainPointsView } from '@/components/pain-points/pain-points-view'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'Pain Points' }

export default async function PainPointsPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: painPoints } = await supabase.from('pain_points').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  return <PainPointsView painPoints={painPoints ?? []} productId={productId} />
}
