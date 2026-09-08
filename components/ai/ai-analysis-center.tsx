'use client'

import { useState } from 'react'
import { Sparkles, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AiAnalysis } from '@/lib/types/database'

interface Props { analyses: AiAnalysis[]; productId: string }

const typeLabel: Record<string, string> = { need_analysis: 'Analyse besoin', test_analysis: 'Analyse test', pain_points: 'Pain Points', insights: 'Insights' }
const statusIcon: Record<string, React.ElementType> = { completed: CheckCircle, failed: XCircle, processing: Clock }
const statusColor: Record<string, string> = { completed: 'var(--success)', failed: 'var(--danger)', processing: 'var(--warning)' }

export function AiAnalysisCenter({ analyses, productId }: Props) {
  const [selected, setSelected] = useState<AiAnalysis | null>(analyses[0] ?? null)
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const types = ['all', ...Array.from(new Set(analyses.map(a => a.analysis_type)))]
  const filtered = typeFilter === 'all' ? analyses : analyses.filter(a => a.analysis_type === typeFilter)

  return (
    <div className="flex h-full">
      <div className="w-72 border-r border-[var(--border-subtle)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-subtle)]">
          <h1 className="text-base font-bold text-[var(--text-primary)] mb-3">AI Analysis Center</h1>
          <div className="flex flex-wrap gap-1">
            {types.map(t => (
              <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2 py-1 rounded-[var(--radius-md)] text-xs font-medium transition-colors', typeFilter === t ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]')}>
                {t === 'all' ? 'Tous' : (typeLabel[t] ?? t)}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Sparkles className="h-8 w-8 text-[var(--text-muted)] mb-2" />
              <p className="text-xs text-[var(--text-muted)]">Aucune analyse.</p>
            </div>
          ) : filtered.map(a => {
            const StatusIcon = statusIcon[a.status] ?? Clock
            return (
              <button key={a.id} onClick={() => setSelected(a)} className={cn('w-full text-left p-3 rounded-[var(--radius-lg)] transition-colors', selected?.id === a.id ? 'bg-[var(--accent-muted)]' : 'hover:bg-[var(--surface-secondary)]')}>
                <div className="flex items-center gap-2 mb-1">
                  <StatusIcon className="h-3.5 w-3.5 shrink-0" style={{ color: statusColor[a.status] ?? 'var(--text-muted)' }} />
                  <span className="text-xs font-medium text-[var(--text-primary)] truncate">{typeLabel[a.analysis_type] ?? a.analysis_type}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{new Date(a.created_at).toLocaleString('fr')}</p>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles className="h-10 w-10 text-[var(--text-muted)] mb-3" />
            <p className="text-sm text-[var(--text-muted)]">Sélectionnez une analyse pour voir les résultats.</p>
          </div>
        ) : (
          <div className="max-w-2xl space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">{typeLabel[selected.analysis_type] ?? selected.analysis_type}</h2>
              <span className="text-xs text-[var(--text-muted)]">{new Date(selected.created_at).toLocaleString('fr')}</span>
            </div>
            {selected.status === 'failed' && selected.error_message && (
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-sm">{selected.error_message}</div>
            )}
            {selected.status === 'processing' && (
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                <Clock className="h-4 w-4 animate-spin" />
                Analyse en cours...
              </div>
            )}
            {selected.result && (
              <pre className="text-xs text-[var(--text-primary)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] rounded-[var(--radius-lg)] p-4 overflow-auto max-h-[calc(100vh-250px)] whitespace-pre-wrap">
                {JSON.stringify(selected.result, null, 2)}
              </pre>
            )}
            {selected.usage && (
              <div className="text-xs text-[var(--text-muted)]">
                Usage: {JSON.stringify(selected.usage)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
