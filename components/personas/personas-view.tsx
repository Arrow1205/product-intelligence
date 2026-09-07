'use client'

import { useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { Persona } from '@/lib/types/database'
import { UserCircle, Trash2 } from 'lucide-react'

interface Props {
  projectId: string
  initialPersonas: Persona[]
}

const defaultForm = {
  name: '',
  age: '',
  job: '',
  goals: '',
  frustrations: '',
  behaviors: '',
  quote: '',
}

export function PersonasView({ projectId, initialPersonas }: Props) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('personas').insert({
      project_id: projectId,
      name: form.name.trim(),
      age: form.age ? parseInt(form.age) : null,
      job: form.job || null,
      goals: form.goals || null,
      frustrations: form.frustrations || null,
      behaviors: form.behaviors || null,
      quote: form.quote || null,
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setPersonas(prev => [data, ...prev])
      setForm(defaultForm)
      setOpen(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    await supabase.from('personas').delete().eq('id', id)
    setPersonas(prev => prev.filter(p => p.id !== id))
    setDeletingId(null)
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Personas"
        description="Définissez les profils utilisateurs de votre produit"
        action={
          <Button onClick={() => setOpen(true)}>Créer un persona</Button>
        }
      />

      {personas.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Aucun persona"
          description="Créez votre premier persona pour définir vos utilisateurs cibles."
          action={{ label: 'Créer un persona', onClick: () => setOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map(persona => (
            <div
              key={persona.id}
              className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[17px] font-semibold text-[var(--text-primary)]">{persona.name}</p>
                  {(persona.age || persona.job) && (
                    <p className="text-[13px] text-[var(--text-muted)]">
                      {[persona.age && `${persona.age} ans`, persona.job].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={persona.status === 'validated' ? 'success' : 'muted'}>
                    {persona.status === 'validated' ? 'Validé' : 'Brouillon'}
                  </Badge>
                  <button
                    onClick={() => handleDelete(persona.id)}
                    disabled={deletingId === persona.id}
                    className={cn(
                      'h-6 w-6 flex items-center justify-center rounded-[var(--radius-sm)]',
                      'text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger-muted)]',
                      'transition-colors disabled:opacity-50',
                    )}
                    title="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              {persona.quote && (
                <p className="text-[13px] italic text-[var(--text-secondary)] border-l-2 border-[var(--border-subtle)] pl-3">
                  &ldquo;{persona.quote}&rdquo;
                </p>
              )}
              {persona.goals && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Objectifs</p>
                  <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2">{persona.goals}</p>
                </div>
              )}
              {persona.frustrations && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Frustrations</p>
                  <p className="text-[13px] text-[var(--text-secondary)] line-clamp-2">{persona.frustrations}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Créer un persona" size="lg">
          <DialogBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Nom *</label>
                <input
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="Ex: Marie, 35 ans"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Âge</label>
                <input
                  type="number"
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="35"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Métier</label>
                <input
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                  placeholder="Chef de projet"
                  value={form.job}
                  onChange={e => setForm(f => ({ ...f, job: e.target.value }))}
                />
              </div>
            </div>
            {(['goals', 'frustrations', 'behaviors'] as const).map(field => (
              <div key={field}>
                <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                  {field === 'goals' ? 'Objectifs' : field === 'frustrations' ? 'Frustrations' : 'Comportements'}
                </label>
                <textarea
                  className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                  rows={2}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Citation</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ce que ce persona dirait..."
                value={form.quote}
                onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreate} disabled={!form.name.trim() || saving}>
              {saving ? 'Enregistrement...' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
