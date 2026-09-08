'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Users, BarChart2, Settings2, Layers } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Test, TestBlock, TestParticipant } from '@/lib/types/database'

interface Props { test: Test; blocks: TestBlock[]; participants: TestParticipant[]; productId: string }

const TABS = [
  { id: 'overview', label: 'Overview', icon: Settings2 },
  { id: 'protocol', label: 'Protocole', icon: Layers },
  { id: 'participants', label: 'Participants', icon: Users },
  { id: 'results', label: 'Résultats', icon: BarChart2 },
]

export function TestDetail({ test, blocks, participants, productId }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState('overview')

  const statusBadge = (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', test.status === 'published' ? 'bg-[var(--success)]/20 text-[var(--success)]' : test.status === 'closed' ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]')}>
      {test.status === 'published' ? 'Publié' : test.status === 'closed' ? 'Terminé' : 'Brouillon'}
    </span>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(`/products/${productId}/tests`)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1 truncate">{test.title}</h1>
          {statusBadge}
        </div>
        <div className="flex gap-1">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-sm transition-colors', tab === t.id ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]')}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {tab === 'overview' && (
          <div className="max-w-2xl space-y-4">
            {test.objective && <div><p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Objectif</p><p className="text-sm text-[var(--text-primary)]">{test.objective}</p></div>}
            {test.context && <div><p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Contexte</p><p className="text-sm text-[var(--text-primary)]">{test.context}</p></div>}
            {test.test_type && <div><p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Type</p><p className="text-sm text-[var(--text-primary)]">{test.test_type}</p></div>}
            {test.estimated_minutes && <div><p className="text-xs font-medium text-[var(--text-muted)] uppercase mb-1">Durée estimée</p><p className="text-sm text-[var(--text-primary)]">{test.estimated_minutes} min</p></div>}
            {test.public_token && test.status === 'published' && (
              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--accent-muted)] border border-[var(--accent-primary)]/20">
                <p className="text-xs font-medium text-[var(--accent-primary)] mb-1">Lien participant</p>
                <code className="text-xs text-[var(--text-primary)] break-all">{typeof window !== 'undefined' ? `${window.location.origin}/test/${test.public_token}` : `/test/${test.public_token}`}</code>
              </div>
            )}
          </div>
        )}
        {tab === 'protocol' && (
          <div className="max-w-2xl space-y-3">
            {blocks.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun bloc de protocole défini.</p>
            ) : blocks.map((block, i) => (
              <div key={block.id} className="flex gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
                <span className="text-xs font-bold text-[var(--text-muted)] w-5 shrink-0">{i + 1}</span>
                <div><p className="text-sm font-medium text-[var(--text-primary)]">{block.block_type}</p><p className="text-xs text-[var(--text-muted)]">{JSON.stringify(block.config)}</p></div>
              </div>
            ))}
          </div>
        )}
        {tab === 'participants' && (
          <div className="max-w-2xl space-y-2">
            {participants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun participant.</p>
            ) : participants.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
                <Users className="h-4 w-4 text-[var(--text-muted)]" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">{p.name ?? p.participant_code ?? 'Anonyme'}</p>
                  {p.email && <p className="text-xs text-[var(--text-muted)]">{p.email}</p>}
                </div>
                <div className="text-right">
                  {p.completed_at ? <span className="text-xs text-[var(--success)]">Terminé</span> : p.started_at ? <span className="text-xs text-[var(--warning)]">En cours</span> : <span className="text-xs text-[var(--text-muted)]">Pas commencé</span>}
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'results' && (
          <div className="max-w-2xl">
            <p className="text-sm text-[var(--text-muted)]">{participants.filter(p => p.completed_at).length} participant(s) ont terminé le test.</p>
          </div>
        )}
      </div>
    </div>
  )
}
