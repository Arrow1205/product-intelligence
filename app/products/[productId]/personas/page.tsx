import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { PersonasList } from '@/components/personas/personas-list'
import { redirect } from 'next/navigation'

export default async function PersonasPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: personas }, { data: tests }] = await Promise.all([
    supabase.from('personas').select('*').eq('product_id', productId).order('created_at', { ascending: false }),
    supabase.from('tests').select('id, title').eq('product_id', productId).eq('status', 'published'),
  ])

  return <PersonasList personas={personas ?? []} tests={tests ?? []} productId={productId} userId={user.id} />
}
