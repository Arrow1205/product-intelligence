'use client'

import { useState } from 'react'
import { AlertTriangle, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { PainPoint } from '@/lib/types/database'

interface Props { painPoints: PainPoint[]; productId: string }

const severityColor: Record<string, string> = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' }
const statusLabel: Record<string, string> = { candidate: 'Candidat', confirmed: 'Confirmé', dismissed: 'Rejeté', resolved: 'Résolu' }

export function PainPointsView({ painPoints: initial, productId }: Props) {
  const [painPoints, setPainPoints] = useState(initial)
  const [filter, setFilter] = useState<string>('all')

  const updateStatus = async (id: string, status: PainPoint['status']) => {
    const supabase = getSupabaseClient()
    await supabase.from('pain_points').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setPainPoints(prev => prev.map(p => p.id === id ? { ...p, status } : p))
  }

  const filtered = filter === 'all' ? painPoints : painPoints.filter(p => p.status === filter)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Pain Points</h1>
        <div className="flex gap-1">
          {['all', 'candidate', 'confirmed', 'dismissed'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn('px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-colors', filter === f ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]')}>
              {f === 'all' ? 'Tous' : statusLabel[f]}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <AlertTriangle className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucun pain point {filter !== 'all' ? `avec le statut "${statusLabel[filter]}"` : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(pp => (
            <div key={pp.id} className="flex items-start gap-3 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
              <span className="mt-1 h-2 w-2 rounded-full shrink-0" style={{ background: severityColor[pp.severity ?? 'low'] ?? 'var(--text-muted)' }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">{pp.title}</p>
                {pp.description && <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{pp.description}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--text-muted)]">{statusLabel[pp.status]}</span>
                  {pp.confidence && <span className="text-xs text-[var(--text-muted)]">confiance: {pp.confidence}</span>}
                  <span className="text-xs text-[var(--text-muted)]">{pp.source}</span>
                </div>
              </div>
              {pp.status === 'candidate' && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => updateStatus(pp.id, 'confirmed')} className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--success)]/10 text-[var(--success)] text-xs hover:bg-[var(--success)]/20 transition-colors">
                    <Check className="h-3 w-3" />
                    Confirmer
                  </button>
                  <button onClick={() => updateStatus(pp.id, 'dismissed')} className="flex items-center gap-1 px-2 py-1 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-xs hover:bg-[var(--danger)]/20 transition-colors">
                    <X className="h-3 w-3" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
