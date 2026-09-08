import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/ssr-client'
import { Sidebar } from '@/components/layout/sidebar'

interface Props {
  children: React.ReactNode
  params: Promise<{ productId: string }>
}

export default async function ProductLayout({ children, params }: Props) {
  const { productId } = await params
  const supabase = await createSupabaseServerClient()
  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) notFound()

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--surface-secondary)]">
      <Sidebar productId={product.id} productName={product.name} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
