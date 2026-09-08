import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { NewProductForm } from '@/components/products/new-product-form'

export const metadata = { title: 'Nouveau produit' }

export default async function NewProductPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return <NewProductForm userId={user.id} />
}
