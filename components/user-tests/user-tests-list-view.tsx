'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { UserTest } from '@/lib/types/database'
import { FlaskConical, Plus, ChevronRight, Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  initialTests: UserTest[]
}

const statusVariant: Record<string, 'muted' | 'info' | 'warning' | 'success'> = {
  draft: 'muted',
  scheduled: 'info',
  in_progress: 'warning',
  completed: 'success',
}
const statusLabel: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifié',
  in_progress: 'En cours',
  completed: 'Terminé',
}
const typeLabel: Record<string, string> = {
  interview: 'Interview',
  usability: 'Test d\'usabilité',
  survey: 'Questionnaire',
  moderated: 'Test modéré',
}

const defaultForm = { title: '', test_type: 'interview', objectives: '' }

export function UserTestsListView({ projectId, initialTests }: Props) {
  const [tests, setTests] = useState<UserTest[]>(initialTests)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true); setError('')
    const { data, error: err } = await supabase.from('user_tests').insert({
      project_id: projectId,
      title: form.title.trim(),
      test_type: form.test_type,
      objectives: form.objectives || null,
    }).select().single()
    setSaving(false)
    if (err) { setError(err.message); return }
    if (data) {
      setTests(prev => [data, ...prev])
      setForm(defaultForm)
      setOpen(false)
      router.push(`/project/${projectId}/user-tests/${data.id}`)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingId(id)
    await supabase.from('user_tests').delete().eq('id', id)
    setTests(prev => prev.filter(t => t.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="User Tests"
        description="Créez et gérez vos tests utilisateurs, analysez les résultats avec l'IA"
        action={
          <Button variant="primary" size="md" onClick={() => setOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Nouveau test
          </Button>
        }
      />

      {tests.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="Aucun test utilisateur"
          description="Créez votre premier test pour commencer à collecter des insights."
          action={{ label: 'Nouveau test', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="space-y-2">
          {tests.map(test => (
            <div
              key={test.id}
              onClick={() => router.push(`/project/${projectId}/user-tests/${test.id}`)}
              className="flex items-center gap-4 rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 cursor-pointer hover:bg-[var(--surface-secondary)] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-medium text-[var(--text-primary)] truncate">{test.title}</p>
                {test.objectives && (
                  <p className="text-[12px] text-[var(--text-muted)] line-clamp-1 mt-0.5">{test.objectives}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="muted">{typeLabel[test.test_type] ?? test.test_type}</Badge>
                <Badge variant={statusVariant[test.status] ?? 'muted'}>{statusLabel[test.status] ?? test.status}</Badge>
                <button
                  onClick={e => handleDelete(test.id, e)}
                  disabled={deletingId === test.id}
                  className={cn(
                    'h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)]',
                    'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                    'transition-colors disabled:opacity-50',
                  )}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Nouveau test utilisateur">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: Test navigation — v2 homepage"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Type de test</label>
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                value={form.test_type}
                onChange={e => setForm(f => ({ ...f, test_type: e.target.value }))}
              >
                <option value="interview">Interview</option>
                <option value="usability">Test d&apos;usabilité</option>
                <option value="survey">Questionnaire</option>
                <option value="moderated">Test modéré</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Objectifs</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={3}
                placeholder="Que souhaitez-vous apprendre ?"
                value={form.objectives}
                onChange={e => setForm(f => ({ ...f, objectives: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            {error && <p className="text-[12px] text-[var(--danger)] flex-1">{error}</p>}
            <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
            <Button onClick={handleCreate} disabled={!form.title.trim() || saving}>
              {saving ? 'Création...' : 'Créer le test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
