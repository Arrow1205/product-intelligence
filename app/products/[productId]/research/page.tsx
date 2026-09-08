import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { ResearchView } from '@/components/research/research-view'

export default async function ResearchPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: painPoints }, { data: insights }] = await Promise.all([
    supabase.from('pain_points').select('id, title, description, status, severity').eq('product_id', productId).neq('status', 'dismissed'),
    supabase.from('insights').select('id, statement, observation, status').eq('product_id', productId).neq('status', 'dismissed').neq('status', 'archived'),
  ])

  return (
    <ResearchView
      productId={productId}
      userId={user.id}
      painPoints={painPoints ?? []}
      insights={insights ?? []}
    />
  )
}
