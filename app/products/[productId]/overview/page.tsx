import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { OverviewView } from '@/components/products/overview-view'

interface Props { params: Promise<{ productId: string }> }

export default async function OverviewPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()

  const [
    { data: product },
    { count: needsCount },
    { count: testsCount },
    { count: painPointsCount },
    { count: insightsCount },
    { data: recommendations },
    { data: activities },
  ] = await Promise.all([
    supabase.from('products').select('*').eq('id', productId).single(),
    supabase.from('need_expressions').select('*', { count: 'exact', head: true }).eq('product_id', productId),
    supabase.from('tests').select('*', { count: 'exact', head: true }).eq('product_id', productId),
    supabase.from('pain_points').select('*', { count: 'exact', head: true }).eq('product_id', productId),
    supabase.from('insights').select('*', { count: 'exact', head: true }).eq('product_id', productId),
    supabase.from('ai_recommendations').select('*').eq('product_id', productId).eq('status', 'active').order('created_at', { ascending: false }).limit(3),
    supabase.from('activity_log').select('*').eq('product_id', productId).order('created_at', { ascending: false }).limit(10),
  ])

  if (!product) notFound()

  return (
    <OverviewView
      product={product}
      needsCount={needsCount ?? 0}
      testsCount={testsCount ?? 0}
      painPointsCount={painPointsCount ?? 0}
      insightsCount={insightsCount ?? 0}
      recommendations={recommendations ?? []}
      activities={activities ?? []}
    />
  )
}
