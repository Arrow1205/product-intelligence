import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { FilesView } from '@/components/files/files-view'

interface Props { params: Promise<{ productId: string }> }

export const metadata = { title: 'Documents' }

export default async function FilesPage({ params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const [{ data: assets }, { data: { user } }] = await Promise.all([
    supabase.from('assets').select('*').eq('product_id', productId).order('created_at', { ascending: false }),
    supabase.auth.getUser(),
  ])
  return <FilesView assets={assets ?? []} productId={productId} userId={user?.id ?? ''} />
}
