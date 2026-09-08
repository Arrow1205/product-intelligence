import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { ProductsListView } from '@/components/products/products-list'

export const metadata = { title: 'Mes produits' }

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return <ProductsListView products={products ?? []} userId={user?.id ?? ''} />
}
