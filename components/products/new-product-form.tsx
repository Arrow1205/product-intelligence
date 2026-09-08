'use client'

import { useRouter } from 'next/navigation'
import { CreateProductDialog } from './create-product-dialog'
import type { Product } from '@/lib/types/database'

export function NewProductForm({ userId }: { userId: string }) {
  const router = useRouter()
  return (
    <CreateProductDialog
      open={true}
      onOpenChange={(v) => { if (!v) router.push('/products') }}
      userId={userId}
      onCreated={(p: Product) => router.push(`/products/${p.id}/overview`)}
    />
  )
}
