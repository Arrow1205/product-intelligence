'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { RoadmapItem } from '@/lib/types/database'
import { BarChart3, Plus, TrendingUp } from 'lucide-react'

interface Props {
  projectId: string
  initialItems: RoadmapItem[]
}

const defaultForm = {
  title: '',
  description: '',
  brass_benefit: '',
  brass_revenue: '',
  brass_alignment: '',
  brass_speed: '',
  brass_saturation: '',
}

function brassTotal(item: RoadmapItem): number {
  return (item.brass_benefit ?? 0) + (item.brass_revenue ?? 0) + (item.brass_alignment ?? 0) + (item.brass_speed ?? 0) + (item.brass_saturation ?? 0)
}

export function GrowthBacklogView({ projectId, initialItems }: Props) {
  const [items, setItems] = useState<RoadmapItem[]>(initialItems)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const sorted = [...items].sort((a, b) => brassTotal(b) - brassTotal(a))

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('roadmap_items').insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description || null,
      type: 'backlog_item',
      status: 'backlog',
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

  const handlePromote = async (item: RoadmapItem) => {
    setPromotingId(item.id)
    // Update status to promoted
    await supabase.from('roadmap_items').update({ status: 'promoted' }).eq('id', item.id)
    // Create a corresponding roadmap item
    await supabase.from('roadmap_items').insert({
      project_id: projectId,
      title: item.title,
      description: item.description,
      type: 'manual',
      status: 'backlog',
      brass_benefit: item.brass_benefit,
      brass_revenue: item.brass_revenue,
      brass_alignment: item.brass_alignment,
      brass_speed: item.brass_speed,
      brass_saturation: item.brass_saturation,
    })
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'promoted' } : i))
    setPromotingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Growth Backlog"
        description="Gérez et priorisez vos idées de croissance avec le score BRASS"
        action={
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Ajouter une idée
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Aucune idée dans le backlog"
          description="Ajoutez des idées de croissance et scorez-les avec le framework BRASS."
          action={{ label: 'Ajouter une idée', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)]">
                <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Titre</th>
                <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] hidden md:table-cell">Description</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">B</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">R</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">A</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">S</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">S</th>
                <th className="text-center py-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Total</th>
                <th className="text-left py-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Statut</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {sorted.map(item => {
                const total = brassTotal(item)
                const promoted = item.status === 'promoted'
                return (
                  <tr key={item.id} className={cn('transition-colors', promoted && 'opacity-50')}>
                    <td className="py-2.5 px-3 font-medium text-[var(--text-primary)] max-w-[200px] truncate">
                      {item.title}
                    </td>
                    <td className="py-2.5 px-3 text-[var(--text-muted)] max-w-[200px] truncate hidden md:table-cell">
                      {item.description || '—'}
                    </td>
                    {[item.brass_benefit, item.brass_revenue, item.brass_alignment, item.brass_speed, item.brass_saturation].map((v, idx) => (
                      <td key={idx} className="py-2.5 px-2 text-center text-[var(--text-secondary)]">
                        {v ?? '—'}
                      </td>
                    ))}
                    <td className="py-2.5 px-2 text-center font-semibold text-[var(--text-primary)]">
                      {total > 0 ? `${total}/25` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {promoted
                        ? <Badge variant="success">Promu en Roadmap</Badge>
                        : <Badge variant="muted">Backlog</Badge>
                      }
                    </td>
                    <td className="py-2.5 px-3">
                      {!promoted && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePromote(item)}
                          disabled={promotingId === item.id}
                        >
                          <TrendingUp className="h-3 w-3" />
                          {promotingId === item.id ? '...' : 'Promouvoir'}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ajouter une idée au Growth Backlog" size="lg">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Nom de l'idée..."
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
            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 space-y-3">
              <p className="text-[13px] font-semibold text-[var(--text-primary)]">Score BRASS (1-5)</p>
              <p className="text-[12px] text-[var(--warning)] font-medium">
                ⚠️ Scores BRASS — saisie manuelle uniquement. Aucune IA ne score le BRASS.
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
