'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { cn } from '@/lib/utils/cn'
import type { RoadmapItem } from '@/lib/types/database'
import { Map, Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  initialItems: RoadmapItem[]
}

const COLUMNS: { key: string; label: string }[] = [
  { key: 'backlog', label: 'Backlog' },
  { key: 'in_progress', label: 'En cours' },
  { key: 'done', label: 'Terminé' },
  { key: 'rejected', label: 'Rejeté' },
]

const columnVariant: Record<string, 'muted' | 'info' | 'success' | 'danger'> = {
  backlog: 'muted',
  in_progress: 'info',
  done: 'success',
  rejected: 'danger',
}

const defaultBrass = { brass_benefit: '', brass_revenue: '', brass_alignment: '', brass_speed: '', brass_saturation: '' }
const defaultForm = { title: '', description: '', status: 'backlog', ...defaultBrass }

function brassScore(item: RoadmapItem): number | null {
  const vals = [item.brass_benefit, item.brass_revenue, item.brass_alignment, item.brass_speed, item.brass_saturation]
  if (vals.every(v => v === null || v === undefined)) return null
  return vals.reduce<number>((acc, v) => acc + (v ?? 0), 0)
}

export function RoadmapView({ projectId, initialItems }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>(initialItems)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('roadmap_items').insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description || null,
      status: form.status,
      brass_benefit: form.brass_benefit ? parseInt(form.brass_benefit) : null,
      brass_revenue: form.brass_revenue ? parseInt(form.brass_revenue) : null,
      brass_alignment: form.brass_alignment ? parseInt(form.brass_alignment) : null,
      brass_speed: form.brass_speed ? parseInt(form.brass_speed) : null,
      brass_saturation: form.brass_saturation ? parseInt(form.brass_saturation) : null,
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
    await supabase.from('roadmap_items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  const getColumnItems = (status: string) =>
    items
      .filter(i => i.status === status)
      .sort((a, b) => {
        const sa = brassScore(a) ?? -1
        const sb = brassScore(b) ?? -1
        return sb - sa
      })

  return (
    <div className="p-6">
      <PageHeader
        title="Roadmap"
        description="Planifiez et priorisez les fonctionnalités avec le score BRASS"
        action={<Button onClick={() => setOpen(true)}>Ajouter un item</Button>}
      />

      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const colItems = getColumnItems(col.key)
          return (
            <div key={col.key} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-secondary)]">{col.label}</span>
                <Badge variant={columnVariant[col.key]}>{colItems.length}</Badge>
              </div>
              {colItems.length === 0 ? (
                <div className="rounded-[var(--radius-panel)] border border-dashed border-[var(--border-subtle)] p-4 text-center text-[12px] text-[var(--text-muted)]">
                  Aucun item
                </div>
              ) : (
                colItems.map(item => {
                  const score = brassScore(item)
                  return (
                    <div
                      key={item.id}
                      className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] leading-tight">{item.title}</p>
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className={cn(
                            'h-5 w-5 flex items-center justify-center rounded-[var(--radius-sm)] shrink-0',
                            'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                            'transition-colors disabled:opacity-50',
                          )}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {item.description && (
                        <p className="text-[12px] text-[var(--text-muted)] line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[11px] text-[var(--text-muted)]">BRASS:</span>
                        <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          {score !== null ? score : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ajouter un item Roadmap" size="lg">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Nom de la fonctionnalité..."
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Description</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={2}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Colonne</label>
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                {COLUMNS.map(col => <option key={col.key} value={col.key}>{col.label}</option>)}
              </select>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 space-y-3">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Score BRASS</p>
              <p className="text-[12px] text-[var(--warning)] font-medium">
                ⚠️ Les scores BRASS sont renseignés manuellement. Aucune IA ne peut les saisir.
              </p>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { field: 'brass_benefit', label: 'Benefit' },
                  { field: 'brass_revenue', label: 'Revenue' },
                  { field: 'brass_alignment', label: 'Alignment' },
                  { field: 'brass_speed', label: 'Speed' },
                  { field: 'brass_saturation', label: 'Saturation' },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <label className="block text-[11px] font-medium text-[var(--text-muted)] mb-1">{label}</label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 py-1.5 text-[13px] text-center text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                      placeholder="1-5"
                      value={form[field as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    />
                  </div>
                ))}
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
