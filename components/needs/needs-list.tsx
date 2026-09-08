'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Trash2, ChevronRight, AlertCircle } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setCreating(true)
    setError(null)
    const supabase = getSupabaseClient()
    const { data, error: dbError } = await supabase
      .from('need_expressions')
      .insert({ user_id: userId, product_id: productId, title: title.trim(), body: '', status: 'draft' })
      .select()
      .single()
    setCreating(false)
    if (dbError) { setError(dbError.message); return }
    if (data) { setNeeds(prev => [data as NeedExpression, ...prev]); setTitle('') }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Supprimer ce besoin ?')) return
    setDeletingId(id)
    const supabase = getSupabaseClient()
    await supabase.from('need_expressions').delete().eq('id', id)
    setNeeds(prev => prev.filter(n => n.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Expressions de besoin</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          placeholder="Titre du besoin..."
          value={title}
          onChange={e => setTitle(e.target.value)}
        />
        <button type="submit" disabled={creating || !title.trim()} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          <Plus className="h-4 w-4" />
          {creating ? 'Création...' : 'Créer'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {needs.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FileText className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucune expression de besoin. Créez-en une ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {needs.map(need => (
            <Link key={need.id} href={`/products/${productId}/needs/${need.id}`}
              className="group flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
            >
              <FileText className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{need.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: statusColor[need.status] ?? 'var(--text-muted)' }}>
                    {statusLabel[need.status] ?? need.status}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{new Date(need.created_at).toLocaleDateString('fr')}</span>
                </div>
              </div>
              <button
                onClick={e => handleDelete(need.id, e)}
                disabled={deletingId === need.id}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-all"
                title="Supprimer"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <ChevronRight className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
