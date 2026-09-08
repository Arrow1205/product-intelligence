import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { NeedsList } from '@/components/needs/needs-list'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'Expressions de besoin' }

export default async function NeedsPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: needs } = await supabase
    .from('need_expressions')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  const { data: { user } } = await supabase.auth.getUser()
  return <NeedsList needs={needs ?? []} productId={productId} userId={user?.id ?? ''} />
}
