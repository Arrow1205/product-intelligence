'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Tag, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { NeedExpression } from '@/lib/types/database'

interface Props { needs: NeedExpression[]; productId: string; userId: string }

const statusLabel: Record<string, string> = { draft: 'Brouillon', active: 'Actif', archived: 'Archivé' }
const statusColor: Record<string, string> = { draft: 'var(--text-muted)', active: 'var(--success)', archived: 'var(--text-muted)' }

export function NeedsList({ needs: initial, productId, userId }: Props) {
  const [needs, setNeeds] = useState(initial)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('need_expressions').insert({ user_id: userId, product_id: productId, title: title.trim(), status: 'draft' }).select().single()
    setCreating(false)
    if (data) { setNeeds(prev => [data as NeedExpression, ...prev]); setTitle('') }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Expressions de besoin</h1>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          placeholder="Titre du besoin..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button type="submit" disabled={creating || !title.trim()} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Plus className="h-4 w-4" />
          Créer
        </button>
      </form>

      {needs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucune expression de besoin. Créez-en une ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {needs.map(need => (
            <Link key={need.id} href={`/products/${productId}/needs/${need.id}`}
              className="flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
            >
              <FileText className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{need.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: statusColor[need.status] ?? 'var(--text-muted)' }}>{statusLabel[need.status] ?? need.status}</span>
                  {need.tags && need.tags.length > 0 && (
                    <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Tag className="h-3 w-3" />{need.tags.slice(0, 3).join(', ')}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{new Date(need.created_at).toLocaleDateString('fr')}</span>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
