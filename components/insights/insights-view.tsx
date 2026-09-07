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
import { Lightbulb, Trash2 } from 'lucide-react'

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

export function InsightsView({ projectId, initialInsights }: Props) {
  const [items, setItems] = useState<Insight[]>(initialInsights)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

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
        action={<Button onClick={() => setOpen(true)}>Ajouter un Insight</Button>}
      />

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
