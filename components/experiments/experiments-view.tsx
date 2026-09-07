'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { UserTest } from '@/lib/types/database'
import { FlaskConical, Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  initialTests: UserTest[]
}

const typeLabel: Record<string, string> = {
  interview: 'Interview',
  usability: "Test d'utilisabilité",
  survey: 'Sondage',
  ab_test: 'A/B Test',
}

const statusVariant: Record<string, 'muted' | 'info' | 'success' | 'warning'> = {
  planned: 'muted',
  in_progress: 'info',
  completed: 'success',
  cancelled: 'warning',
}

const statusLabel: Record<string, string> = {
  planned: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
}

const defaultForm = { title: '', test_type: 'interview', status: 'planned', objectives: '', notes: '', scheduled_at: '' }

export function ExperimentsView({ projectId, initialTests }: Props) {
  const [items, setItems] = useState<UserTest[]>(initialTests)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('user_tests').insert({
      project_id: projectId,
      title: form.title.trim(),
      test_type: form.test_type,
      status: form.status,
      objectives: form.objectives || null,
      notes: form.notes || null,
      scheduled_at: form.scheduled_at || null,
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
    await supabase.from('user_tests').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Tests Utilisateurs"
        description="Planifiez et suivez vos sessions de recherche utilisateur"
        action={<Button onClick={() => setOpen(true)}>Planifier un test</Button>}
      />

      {items.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Aucun test planifié"
          description="Planifiez vos interviews, tests d'utilisabilité et sondages."
          action={{ label: 'Planifier un test', onClick: () => setOpen(true) }}
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
                {item.objectives && (
                  <p className="text-[12px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{item.objectives}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="default">{typeLabel[item.test_type] ?? item.test_type}</Badge>
                <Badge variant={statusVariant[item.status] ?? 'muted'}>{statusLabel[item.status] ?? item.status}</Badge>
                {item.scheduled_at && (
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {new Date(item.scheduled_at).toLocaleDateString('fr-FR')}
                  </span>
                )}
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
        <DialogContent title="Planifier un test utilisateur" size="lg">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: Interview onboarding — segment B2B"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Type</label>
                <select
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  value={form.test_type}
                  onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))}
                >
                  <option value="interview">Interview</option>
                  <option value="usability">Test d&apos;utilisabilité</option>
                  <option value="survey">Sondage</option>
                  <option value="ab_test">A/B Test</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Statut</label>
                <select
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="planned">Planifié</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminé</option>
                  <option value="cancelled">Annulé</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Date planifiée</label>
                <input
                  type="date"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  value={form.scheduled_at}
                  onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Objectifs</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={2}
                value={form.objectives}
                onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
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
            <Button onClick={handleCreate} disabled={!form.title.trim() || saving}>
              {saving ? 'Enregistrement...' : 'Planifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
