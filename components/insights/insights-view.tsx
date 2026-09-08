'use client'

import { useState } from 'react'
import { Lightbulb, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Insight } from '@/lib/types/database'

interface Props { insights: Insight[]; productId: string }

const statusLabel: Record<string, string> = { candidate: 'Candidat', validated: 'Validé', dismissed: 'Rejeté', archived: 'Archivé' }

export function InsightsView({ insights: initial, productId }: Props) {
  const [insights, setInsights] = useState(initial)
  const [filter, setFilter] = useState<string>('all')

  const updateStatus = async (id: string, status: Insight['status']) => {
    const supabase = getSupabaseClient()
    await supabase.from('insights').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setInsights(prev => prev.map(i => i.id === id ? { ...i, status } : i))
  }

  const filtered = filter === 'all' ? insights : insights.filter(i => i.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Insights</h1>
        <div className="flex gap-1">
          {['all', 'candidate', 'validated', 'dismissed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors', filter === f ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]')}>
              {f === 'all' ? 'Tous' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Lightbulb className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucun insight {filter !== 'all' ? `avec le statut "${statusLabel[filter]}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(insight => (
            <div key={insight.id} className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{insight.statement}</p>
                  {insight.observation && <p className="text-xs text-[var(--text-secondary)] mt-1"><span className="font-medium">Observation:</span> {insight.observation}</p>}
                  {insight.implication && <p className="text-xs text-[var(--text-secondary)] mt-0.5"><span className="font-medium">Implication:</span> {insight.implication}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-[var(--text-muted)]">{statusLabel[insight.status]}</span>
                    {insight.confidence && <span className="text-xs text-[var(--text-muted)]">confiance: {insight.confidence}</span>}
                  </div>
                </div>
                {insight.status === 'candidate' && (
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => updateStatus(insight.id, 'validated')} className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--success)]/10 text-[var(--success)] text-xs hover:bg-[var(--success)]/20 transition-colors">
                      <Check className="h-3 w-3" />
                      Valider
                    </button>
                    <button onClick={() => updateStatus(insight.id, 'dismissed')} className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-xs hover:bg-[var(--danger)]/20 transition-colors">
                      <X className="h-3 w-3" />
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
