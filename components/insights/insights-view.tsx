'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { Insight } from '@/lib/types/database'
import { Lightbulb, Trash2, Sparkles, Plus, X } from 'lucide-react'

interface Props {
  projectId: string
  initialInsights: Insight[]
}

const typeVariant: Record<string, 'accent' | 'info' | 'success' | 'warning'> = {
  observation: 'accent',
  hypothesis: 'info',
  conclusion: 'success',
  opportunity: 'warning',
}

const typeLabel: Record<string, string> = {
  observation: 'Observation',
  hypothesis: 'Hypothèse',
  conclusion: 'Conclusion',
  opportunity: 'Opportunité',
}

const confidenceVariant: Record<string, 'muted' | 'info' | 'success'> = {
  low: 'muted',
  medium: 'info',
  high: 'success',
}

const confidenceLabel: Record<string, string> = {
  low: 'Faible',
  medium: 'Moyenne',
  high: 'Élevée',
}

const defaultForm = { title: '', description: '', type: 'observation', confidence: 'low' }

type AiSuggestion = { title: string; description: string; type: string; confidence: string }

export function InsightsView({ projectId, initialInsights }: Props) {
  const [items, setItems] = useState<Insight[]>(initialInsights)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([])
  const [aiError, setAiError] = useState('')

  const supabase = getSupabaseClient()

  const handleAiSuggest = async () => {
    setAiLoading(true); setAiError(''); setAiSuggestions([])
    const res = await fetch('/api/ai/insights', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId }) })
    const data = await res.json()
    setAiLoading(false)
    if (data.error) { setAiError(data.error); return }
    setAiSuggestions(data.suggestions ?? [])
  }

  const handleAddSuggestion = async (s: AiSuggestion) => {
    const { data } = await supabase.from('insights').insert({
      project_id: projectId,
      title: s.title,
      description: s.description || null,
      type: s.type || 'observation',
      confidence: s.confidence || 'low',
    }).select().single()
    if (data) {
      setItems(prev => [data, ...prev])
      setAiSuggestions(prev => prev.filter(x => x.title !== s.title))
    }
  }

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('insights').insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description || null,
      type: form.type,
      confidence: form.confidence,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setItems(prev => [data, ...prev])
      setForm(defaultForm)
      setOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('insights').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Insights"
        description="Capitalisez sur les apprentissages issus de votre recherche"
        action={
          <div className="flex gap-2">
            <Button variant="secondary" size="md" onClick={handleAiSuggest} loading={aiLoading}>
              <Sparkles className="h-3.5 w-3.5" /> Suggestions IA
            </Button>
            <Button variant="primary" size="md" onClick={() => setOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Ajouter
            </Button>
          </div>
        }
      />

      {(aiSuggestions.length > 0 || aiError) && (
        <div className="mb-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" /> Suggestions IA
            </p>
            <button onClick={() => setAiSuggestions([])} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          {aiError && <p className="text-[12px] text-[var(--danger)]">{aiError}</p>}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {aiSuggestions.map((s, i) => (
              <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 flex flex-col gap-2">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">{s.title}</p>
                {s.description && <p className="text-[12px] text-[var(--text-secondary)] line-clamp-2">{s.description}</p>}
                <div className="flex items-center gap-1.5">
                  <Badge variant={typeVariant[s.type] ?? 'default'}>{typeLabel[s.type] ?? s.type}</Badge>
                  <Badge variant={confidenceVariant[s.confidence] ?? 'muted'}>{confidenceLabel[s.confidence] ?? s.confidence}</Badge>
                </div>
                <Button size="sm" onClick={() => handleAddSuggestion(s)} className="mt-auto">
                  <Plus className="h-3 w-3" /> Ajouter
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Aucun Insight"
          description="Documentez vos observations, hypothèses et conclusions."
          action={{ label: 'Ajouter un Insight', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(item => (
            <div
              key={item.id}
              className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-medium text-[var(--text-primary)] leading-tight">{item.title}</p>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className={cn(
                    'h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)] shrink-0',
                    'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                    'transition-colors disabled:opacity-50',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              {item.description && (
                <p className="text-[13px] text-[var(--text-secondary)] line-clamp-3">{item.description}</p>
              )}
              <div className="flex items-center gap-1.5 mt-auto pt-1">
                <Badge variant={typeVariant[item.type] ?? 'default'}>{typeLabel[item.type] ?? item.type}</Badge>
                <Badge variant={confidenceVariant[item.confidence] ?? 'muted'}>
                  {confidenceLabel[item.confidence] ?? item.confidence}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ajouter un Insight">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: Les utilisateurs abandonnent à l'étape 3..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Type</label>
                <select
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                >
                  <option value="observation">Observation</option>
                  <option value="hypothesis">Hypothèse</option>
                  <option value="conclusion">Conclusion</option>
                  <option value="opportunity">Opportunité</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Confiance</label>
                <select
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  value={form.confidence}
                  onChange={e => setForm(f => ({ ...f, confidence: e.target.value }))}
                >
                  <option value="low">Faible</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Élevée</option>
                </select>
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!form.title.trim() || saving}>
              {saving ? 'Enregistrement...' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
