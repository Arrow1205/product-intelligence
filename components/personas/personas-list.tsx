'use client'

import { useState } from 'react'
import { Plus, Sparkles, Trash2, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Persona } from '@/lib/types/database'

type TestStub = { id: string; title: string }

interface PersonasListProps {
  personas: Persona[]
  tests: TestStub[]
  productId: string
  userId: string
}

const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function getInitials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

interface PersonaFormData {
  name: string
  job_title: string
  age_range: string
  description: string
  goals: string[]
  frustrations: string[]
  behaviors: string
  quote: string
  avatar_color: string
}

const emptyForm: PersonaFormData = {
  name: '',
  job_title: '',
  age_range: '',
  description: '',
  goals: [''],
  frustrations: [''],
  behaviors: '',
  quote: '',
  avatar_color: '#6366f1',
}

interface PersonaModalProps {
  mode: 'create' | 'edit'
  initial: PersonaFormData
  onSave: (data: PersonaFormData) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
  saving: boolean
}

function PersonaModal({ mode, initial, onSave, onDelete, onClose, saving }: PersonaModalProps) {
  const [form, setForm] = useState<PersonaFormData>(initial)

  const set = (field: keyof PersonaFormData, value: string | string[]) =>
    setForm(f => ({ ...f, [field]: value }))

  const updateList = (field: 'goals' | 'frustrations', idx: number, value: string) => {
    const arr = [...form[field]]
    arr[idx] = value
    set(field, arr)
  }

  const addListItem = (field: 'goals' | 'frustrations') =>
    set(field, [...form[field], ''])

  const removeListItem = (field: 'goals' | 'frustrations', idx: number) => {
    const arr = form[field].filter((_, i) => i !== idx)
    set(field, arr.length === 0 ? [''] : arr)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
            {mode === 'create' ? 'Nouveau persona' : 'Modifier le persona'}
          </h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">×</button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Nom *</label>
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              placeholder="Ex: Marie, la Product Manager pressée"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Poste</label>
              <input
                value={form.job_title}
                onChange={e => set('job_title', e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: Product Manager"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Tranche d'âge</label>
              <input
                value={form.age_range}
                onChange={e => set('age_range', e.target.value)}
                className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: 28-35"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={3}
              className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            />
          </div>

          {(['goals', 'frustrations'] as const).map(field => (
            <div key={field}>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1 capitalize">
                {field === 'goals' ? 'Objectifs' : 'Frustrations'}
              </label>
              <div className="space-y-1.5">
                {form[field].map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      value={item}
                      onChange={e => updateList(field, idx, e.target.value)}
                      className="flex-1 border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                    />
                    <button
                      onClick={() => removeListItem(field, idx)}
                      className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem(field)}
                  className="text-[12px] text-[var(--accent-primary)] hover:underline"
                >
                  + Ajouter
                </button>
              </div>
            </div>
          ))}

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Comportements</label>
            <textarea
              value={form.behaviors}
              onChange={e => set('behaviors', e.target.value)}
              rows={2}
              className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Citation représentative</label>
            <input
              value={form.quote}
              onChange={e => set('quote', e.target.value)}
              className="w-full border border-[var(--border-strong)] rounded-[var(--radius-md)] px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
              placeholder='"…"'
            />
          </div>

          <div>
            <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-2">Couleur avatar</label>
            <div className="flex gap-2 flex-wrap">
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => set('avatar_color', color)}
                  className={cn(
                    'h-7 w-7 rounded-full transition-transform',
                    form.avatar_color === color && 'ring-2 ring-offset-2 ring-[var(--accent-primary)] scale-110',
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div>
            {mode === 'edit' && onDelete && (
              <button
                onClick={onDelete}
                disabled={saving}
                className="text-[13px] text-[var(--danger)] hover:underline disabled:opacity-50"
              >
                Supprimer
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-[13px] rounded-[var(--radius-md)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"
            >
              Annuler
            </button>
            <button
              onClick={() => onSave(form)}
              disabled={saving || !form.name.trim()}
              className="px-3 py-1.5 text-[13px] rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-50"
            >
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface AiPreviewModalProps {
  suggestions: PersonaFormData[]
  onImport: (p: PersonaFormData) => Promise<void>
  onClose: () => void
  importing: string | null
}

function AiPreviewModal({ suggestions, onImport, onClose, importing }: AiPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Personas suggérés par IA</h2>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {suggestions.map((p, i) => (
            <div key={i} className="border border-[var(--border-subtle)] rounded-[var(--radius-md)] p-4">
              <div className="flex items-start gap-3">
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                  style={{ backgroundColor: p.avatar_color || '#6366f1' }}
                >
                  {getInitials(p.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{[p.job_title, p.age_range].filter(Boolean).join(' · ')}</p>
                  {p.description && <p className="text-[13px] text-[var(--text-secondary)] mt-1">{p.description}</p>}
                  {p.quote && <p className="text-[12px] italic text-[var(--text-muted)] mt-1">"{p.quote}"</p>}
                </div>
                <button
                  onClick={() => onImport(p)}
                  disabled={importing !== null}
                  className="shrink-0 px-3 py-1.5 text-[12px] rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:opacity-50"
                >
                  {importing === String(i) ? 'Import…' : 'Importer'}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex justify-end">
          <button onClick={onClose} className="px-3 py-1.5 text-[13px] rounded-[var(--radius-md)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]">
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}

export function PersonasList({ personas: initial, tests, productId, userId }: PersonasListProps) {
  const [personas, setPersonas] = useState<Persona[]>(initial)
  const [modal, setModal] = useState<{ mode: 'create' | 'edit'; persona?: Persona } | null>(null)
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiDropdown, setAiDropdown] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<PersonaFormData[] | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  const supabase = getSupabaseClient()

  const toFormData = (p: Persona): PersonaFormData => ({
    name: p.name,
    job_title: p.job_title ?? '',
    age_range: p.age_range ?? '',
    description: p.description ?? '',
    goals: p.goals && p.goals.length > 0 ? p.goals : [''],
    frustrations: p.frustrations && p.frustrations.length > 0 ? p.frustrations : [''],
    behaviors: p.behaviors ?? '',
    quote: p.quote ?? '',
    avatar_color: p.avatar_color ?? '#6366f1',
  })

  const handleCreate = async (form: PersonaFormData) => {
    setSaving(true)
    const { data, error } = await supabase.from('personas').insert({
      user_id: userId,
      product_id: productId,
      name: form.name,
      job_title: form.job_title || null,
      age_range: form.age_range || null,
      description: form.description || null,
      goals: form.goals.filter(Boolean),
      frustrations: form.frustrations.filter(Boolean),
      behaviors: form.behaviors || null,
      quote: form.quote || null,
      avatar_color: form.avatar_color || null,
      source: 'manual',
    }).select().single()
    setSaving(false)
    if (!error && data) {
      setPersonas(ps => [data as Persona, ...ps])
      setModal(null)
    }
  }

  const handleUpdate = async (form: PersonaFormData) => {
    if (!modal?.persona) return
    setSaving(true)
    const { data, error } = await supabase.from('personas').update({
      name: form.name,
      job_title: form.job_title || null,
      age_range: form.age_range || null,
      description: form.description || null,
      goals: form.goals.filter(Boolean),
      frustrations: form.frustrations.filter(Boolean),
      behaviors: form.behaviors || null,
      quote: form.quote || null,
      avatar_color: form.avatar_color || null,
    }).eq('id', modal.persona.id).select().single()
    setSaving(false)
    if (!error && data) {
      setPersonas(ps => ps.map(p => p.id === modal.persona!.id ? data as Persona : p))
      setModal(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce persona ?')) return
    await supabase.from('personas').delete().eq('id', id)
    setPersonas(ps => ps.filter(p => p.id !== id))
    setModal(null)
  }

  const handleSuggest = async (testId: string) => {
    setAiDropdown(false)
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai/suggest-personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId, productId }),
      })
      const json = await res.json()
      setAiSuggestions(json.personas ?? [])
    } finally {
      setAiLoading(false)
    }
  }

  const handleImport = async (p: PersonaFormData, idx: number) => {
    setImporting(String(idx))
    const { data, error } = await supabase.from('personas').insert({
      user_id: userId,
      product_id: productId,
      name: p.name,
      job_title: p.job_title || null,
      age_range: p.age_range || null,
      description: p.description || null,
      goals: p.goals.filter(Boolean),
      frustrations: p.frustrations.filter(Boolean),
      behaviors: p.behaviors || null,
      quote: p.quote || null,
      avatar_color: p.avatar_color || null,
      source: 'ai',
    }).select().single()
    setImporting(null)
    if (!error && data) {
      setPersonas(ps => [data as Persona, ...ps])
    }
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">Personas</h1>
          <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{personas.length} persona{personas.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {tests.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setAiDropdown(v => !v)}
                disabled={aiLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-[var(--radius-md)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {aiLoading ? 'Génération…' : 'Suggérer via IA'}
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', aiDropdown && 'rotate-180')} />
              </button>
              {aiDropdown && (
                <div className="absolute right-0 top-full mt-1 z-20 min-w-[200px] rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white shadow-[var(--shadow-md)] overflow-hidden">
                  {tests.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSuggest(t.id)}
                      className="block w-full text-left px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]"
                    >
                      {t.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setModal({ mode: 'create' })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Nouveau persona
          </button>
        </div>
      </div>

      {personas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[14px] text-[var(--text-muted)]">Aucun persona pour l'instant</p>
          <p className="text-[13px] text-[var(--text-muted)] mt-1">Créez-en un manuellement ou générez-en depuis un test publié.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {personas.map(persona => (
            <PersonaCard
              key={persona.id}
              persona={persona}
              onClick={() => setModal({ mode: 'edit', persona })}
              onDelete={() => handleDelete(persona.id)}
            />
          ))}
        </div>
      )}

      {modal && (
        <PersonaModal
          mode={modal.mode}
          initial={modal.persona ? toFormData(modal.persona) : emptyForm}
          onSave={modal.mode === 'create' ? handleCreate : handleUpdate}
          onDelete={modal.persona ? () => handleDelete(modal.persona!.id) : undefined}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}

      {aiSuggestions && (
        <AiPreviewModal
          suggestions={aiSuggestions}
          onImport={(p) => {
            const idx = aiSuggestions.indexOf(p)
            return handleImport(p, idx)
          }}
          onClose={() => setAiSuggestions(null)}
          importing={importing}
        />
      )}
    </div>
  )
}

function PersonaCard({ persona, onClick, onDelete }: { persona: Persona; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white rounded-[var(--radius-lg)] border border-[var(--border-subtle)] p-4 cursor-pointer hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] transition-all"
    >
      <button
        onClick={e => { e.stopPropagation(); onDelete() }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[var(--text-muted)] hover:text-[var(--danger)] transition-all"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
          style={{ backgroundColor: persona.avatar_color ?? '#6366f1' }}
        >
          {getInitials(persona.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{persona.name}</p>
          <p className="text-[12px] text-[var(--text-muted)] truncate">
            {[persona.job_title, persona.age_range].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      {persona.description && (
        <p className="mt-3 text-[13px] text-[var(--text-secondary)] line-clamp-2">{persona.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium',
          persona.source === 'ai'
            ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
            : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]',
        )}>
          {persona.source === 'ai' ? 'Suggéré par IA' : 'Manuel'}
        </span>
      </div>
    </div>
  )
}
