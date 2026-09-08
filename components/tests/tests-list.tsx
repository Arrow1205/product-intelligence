'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FlaskConical, ChevronRight, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Test } from '@/lib/types/database'

interface Props { tests: Test[]; productId: string; userId: string }

const statusLabel: Record<string, string> = { draft: 'Brouillon', published: 'Publié', closed: 'Terminé' }
const statusColor: Record<string, string> = { draft: 'var(--text-muted)', published: 'var(--success)', closed: 'var(--accent-primary)' }

export function TestsList({ tests: initial, productId }: Props) {
  const [tests, setTests] = useState(initial)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (testId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Supprimer ce test et toutes ses données ?')) return
    setDeletingId(testId)
    const supabase = getSupabaseClient()
    await supabase.from('tests').delete().eq('id', testId)
    setTests(prev => prev.filter(t => t.id !== testId))
    setDeletingId(null)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Tests utilisateurs</h1>
        <Link href={`/products/${productId}/tests/new`} className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" />
          Nouveau test
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FlaskConical className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucun test. Créez votre premier test utilisateur.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tests.map(test => (
            <Link key={test.id} href={`/products/${productId}/tests/${test.id}`}
              className="group flex items-center gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
            >
              <FlaskConical className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">{test.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs" style={{ color: statusColor[test.status] ?? 'var(--text-muted)' }}>
                    {statusLabel[test.status] ?? test.status}
                  </span>
                  {test.test_type && <span className="text-xs text-[var(--text-muted)]">{test.test_type}</span>}
                  {test.estimated_minutes && <span className="text-xs text-[var(--text-muted)]">{test.estimated_minutes} min</span>}
                </div>
              </div>
              <span className="text-xs text-[var(--text-muted)] shrink-0">{new Date(test.created_at).toLocaleDateString('fr')}</span>
              <button
                onClick={e => handleDelete(test.id, e)}
                disabled={deletingId === test.id}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50 transition-all"
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
