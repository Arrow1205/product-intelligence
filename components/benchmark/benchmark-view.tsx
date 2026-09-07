'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { BenchmarkEntry, Json } from '@/lib/types/database'
import { BarChart2, Sparkles, Trash2, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  projectId: string
  initialEntries: BenchmarkEntry[]
  projectName: string
  projectDescription: string
}

interface AiAnalysis {
  strengths?: string[]
  weaknesses?: string[]
  differentiators?: string[]
  opportunities?: string[]
}

function parseAnalysis(raw: Json | null): AiAnalysis | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  return raw as AiAnalysis
}

const defaultForm = { name: '', url: '', notes: '' }

export function BenchmarkView({ projectId, initialEntries, projectName, projectDescription }: Props) {
  const [entries, setEntries] = useState<BenchmarkEntry[]>(initialEntries)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [analyzingId, setAnalyzingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('benchmark_entries').insert({
      project_id: projectId,
      name: form.name.trim(),
      url: form.url || null,
      notes: form.notes || null,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setEntries(prev => [data, ...prev])
      setForm(defaultForm)
      setOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('benchmark_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    setDeletingId(null)
  }

  const handleAnalyze = async (entry: BenchmarkEntry) => {
    setAnalyzingId(entry.id)
    try {
      const res = await fetch('/api/benchmark/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: entry.url, projectName, projectDescription }),
      })
      const analysis = await res.json()
      if (!analysis.error) {
        await supabase.from('benchmark_entries').update({ ai_analysis: analysis }).eq('id', entry.id)
        setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, ai_analysis: analysis } : e))
        setExpandedId(entry.id)
      }
    } finally {
      setAnalyzingId(null)
    }
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Benchmark Concurrentiel"
        description="Analysez vos concurrents avec l'aide de l'IA"
        action={<Button onClick={() => setOpen(true)}>Ajouter un concurrent</Button>}
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="Aucun concurrent référencé"
          description="Ajoutez vos concurrents pour les analyser avec l'IA."
          action={{ label: 'Ajouter un concurrent', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const analysis = parseAnalysis(entry.ai_analysis)
            const isExpanded = expandedId === entry.id
            return (
              <div
                key={entry.id}
                className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] overflow-hidden"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-medium text-[var(--text-primary)]">{entry.name}</p>
                      {entry.url && (
                        <a
                          href={entry.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                    {entry.url && (
                      <p className="text-[12px] text-[var(--text-muted)] truncate">{entry.url}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={analysis ? 'success' : 'muted'}>
                      {analysis ? 'Analysé' : 'Non analysé'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAnalyze(entry)}
                      disabled={analyzingId === entry.id}
                      className="gap-1.5"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {analyzingId === entry.id ? 'Analyse...' : 'Analyser avec l\'IA'}
                    </Button>
                    {analysis && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(entry.id)}
                      disabled={deletingId === entry.id}
                      className={cn(
                        'h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)]',
                        'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                        'transition-colors disabled:opacity-50',
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {analysis && isExpanded && (
                  <div className="border-t border-[var(--border-subtle)] px-4 py-4 grid grid-cols-2 gap-4">
                    {[
                      { key: 'strengths', label: 'Forces', variant: 'success' as const },
                      { key: 'weaknesses', label: 'Faiblesses', variant: 'danger' as const },
                      { key: 'differentiators', label: 'Différenciateurs', variant: 'accent' as const },
                      { key: 'opportunities', label: 'Opportunités', variant: 'warning' as const },
                    ].map(({ key, label, variant }) => {
                      const items = analysis[key as keyof AiAnalysis]
                      if (!items?.length) return null
                      return (
                        <div key={key}>
                          <p className="text-[11px] font-semibold uppercase tracking-wide mb-2">
                            <Badge variant={variant}>{label}</Badge>
                          </p>
                          <ul className="space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="text-[13px] text-[var(--text-secondary)] flex gap-2">
                                <span className="text-[var(--text-muted)] shrink-0">·</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ajouter un concurrent">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Nom *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Nom du concurrent"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">URL</label>
              <input
                type="url"
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="https://..."
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Notes</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={2}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
