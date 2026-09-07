'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { PainPoint } from '@/lib/types/database'
import { AlertTriangle, Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  initialPainPoints: PainPoint[]
}

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'muted'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'muted',
}

const severityLabel: Record<string, string> = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
}

const frequencyLabel: Record<string, string> = {
  constant: 'Constante',
  frequent: 'Fréquente',
  occasional: 'Occasionnelle',
  rare: 'Rare',
}

const statusLabel: Record<string, string> = {
  identified: 'Identifié',
  confirmed: 'Confirmé',
  resolved: 'Résolu',
}

const defaultForm = { title: '', description: '', severity: 'medium', frequency: 'occasional', status: 'identified' }

export function PainPointsView({ projectId, initialPainPoints }: Props) {
  const [items, setItems] = useState<PainPoint[]>(initialPainPoints)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('pain_points').insert({
      project_id: projectId,
      title: form.title.trim(),
      description: form.description || null,
      severity: form.severity,
      frequency: form.frequency,
      status: form.status,
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
    await supabase.from('pain_points').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Pain Points"
        description="Identifiez et suivez les problèmes rencontrés par vos utilisateurs"
        action={<Button onClick={() => setOpen(true)}>Ajouter un Pain Point</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={AlertTriangle}
          title="Aucun Pain Point"
          description="Documentez les problèmes identifiés chez vos utilisateurs."
          action={{ label: 'Ajouter un Pain Point', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{item.title}</p>
                {item.description && (
                  <p className="text-[13px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{item.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={severityVariant[item.severity] ?? 'muted'}>
                  {severityLabel[item.severity] ?? item.severity}
                </Badge>
                <Badge variant="default">{frequencyLabel[item.frequency] ?? item.frequency}</Badge>
                <Badge variant={item.status === 'resolved' ? 'success' : 'default'}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className={cn(
                    'h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)]',
                    'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                    'transition-colors disabled:opacity-50',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Ajouter un Pain Point">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Décrivez le problème..."
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
            <div className="grid grid-cols-3 gap-3">
              {[
                { field: 'severity', label: 'Sévérité', options: [['critical','Critique'],['high','Élevée'],['medium','Moyenne'],['low','Faible']] },
                { field: 'frequency', label: 'Fréquence', options: [['constant','Constante'],['frequent','Fréquente'],['occasional','Occasionnelle'],['rare','Rare']] },
                { field: 'status', label: 'Statut', options: [['identified','Identifié'],['confirmed','Confirmé'],['resolved','Résolu']] },
              ].map(({ field, label, options }) => (
                <div key={field}>
                  <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">{label}</label>
                  <select
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    value={form[field as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  >
                    {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
                  </select>
                </div>
              ))}
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
