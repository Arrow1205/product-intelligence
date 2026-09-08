'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/database'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  userId: string
  onCreated: (product: Product) => void
}

const STAGES = [
  { value: 'idea', label: 'Idée' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'build', label: 'Build' },
  { value: 'launched', label: 'Lancé' },
  { value: 'growth', label: 'Croissance' },
]

const TYPES = [
  { value: 'saas', label: 'SaaS' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'api', label: 'API / Platform' },
  { value: 'other', label: 'Autre' },
]

export function CreateProductDialog({ open, onOpenChange, userId, onCreated }: Props) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stage, setStage] = useState('discovery')
  const [type, setType] = useState('saas')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Le nom est requis'); return }
    setLoading(true)
    setError('')
    const supabase = getSupabaseClient()
    const { data, error: err } = await supabase
      .from('products')
      .insert({ user_id: userId, name: name.trim(), short_description: description.trim() || null, stage, product_type: type, status: 'active' })
      .select()
      .single()
    setLoading(false)
    if (err || !data) { setError(err?.message ?? 'Erreur'); return }
    onCreated(data as Product)
    setName('')
    setDescription('')
    router.push(`/products/${data.id}/overview`)
  }

  const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]'
  const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Nouveau produit</h2>
          <button onClick={() => onOpenChange(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nom du produit *</label>
            <input className={inputCls} placeholder="Ex: MonApp" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Description courte</label>
            <textarea className={cn(inputCls, 'resize-none h-20')} placeholder="Décrivez votre produit en une phrase..." value={description} onChange={e => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stade</label>
              <select className={inputCls} value={stage} onChange={e => setStage(e.target.value)}>
                {STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Type</label>
              <select className={inputCls} value={type} onChange={e => setType(e.target.value)}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
