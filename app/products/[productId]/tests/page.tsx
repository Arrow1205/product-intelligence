import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { TestsList } from '@/components/tests/tests-list'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'Tests' }

export default async function TestsPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: tests } = await supabase.from('tests').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  const { data: { user } } = await supabase.auth.getUser()
  return <TestsList tests={tests ?? []} productId={productId} userId={user?.id ?? ''} />
}
