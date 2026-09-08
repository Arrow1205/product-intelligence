'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Package, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { CreateProductDialog } from './create-product-dialog'
import type { Product } from '@/lib/types/database'

interface Props {
  products: Product[]
  userId: string
}

export function ProductsListView({ products: initialProducts, userId }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [dialogOpen, setDialogOpen] = useState(false)

  const stageLabel: Record<string, string> = {
    idea: 'Idée',
    discovery: 'Discovery',
    build: 'Build',
    launched: 'Lancé',
    growth: 'Croissance',
  }

  return (
    <div className="min-h-screen bg-[var(--surface-secondary)] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">Mes produits</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">{products.length} produit{products.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="h-4 w-4" />
            Nouveau produit
          </button>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-12 w-12 text-[var(--text-muted)] mb-4" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Aucun produit</h2>
            <p className="text-sm text-[var(--text-muted)] mb-6">Créez votre premier produit pour commencer.</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              Créer un produit
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {products.map(product => (
              <Link
                key={product.id}
                href={`/products/${product.id}/overview`}
                className="flex flex-col gap-3 p-5 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">{product.name}</h2>
                  {product.stage && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-primary)] shrink-0">
                      {stageLabel[product.stage] ?? product.stage}
                    </span>
                  )}
                </div>
                {product.short_description && (
                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{product.short_description}</p>
                )}
                <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-auto">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(product.created_at).toLocaleDateString('fr')}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        userId={userId}
        onCreated={(p) => {
          setProducts(prev => [p, ...prev])
          setDialogOpen(false)
        }}
      />
    </div>
  )
}
