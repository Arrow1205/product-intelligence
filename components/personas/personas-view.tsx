'use client'

import { useRef, useState } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogBody, DialogFooter, DialogClose } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { cn } from '@/lib/utils/cn'
import type { Persona } from '@/lib/types/database'
import { UserCircle, Trash2, Upload, FlaskConical } from 'lucide-react'

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

const EXAMPLE_JSON = `[
  {
    "name": "Marie Dupont",
    "age": 34,
    "job": "Responsable Marketing",
    "goals": "Gagner du temps sur les tâches répétitives",
    "frustrations": "Trop d'outils différents à gérer",
    "behaviors": "Consulte ses emails dès le matin",
    "quote": "Je veux un outil qui s'adapte à moi, pas l'inverse.",
    "status": "draft"
  }
]`

export function PersonasView({ projectId, initialPersonas }: Props) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Test dialog state
  const [testPersona, setTestPersona] = useState<Persona | null>(null)
  const defaultTest = { title: '', test_type: 'interview', objectives: '', notes: '' }
  const [testForm, setTestForm] = useState(defaultTest)
  const [testSaving, setTestSaving] = useState(false)

  const handleCreateTest = async () => {
    if (!testPersona || !testForm.title.trim()) return
    setTestSaving(true)
    await supabase.from('user_tests').insert({
      project_id: projectId,
      title: testForm.title.trim(),
      test_type: testForm.test_type,
      objectives: testForm.objectives || null,
      notes: testForm.notes || null,
    })
    setTestSaving(false)
    setTestPersona(null)
    setTestForm(defaultTest)
  }

  // Import dialog state
  const [importOpen, setImportOpen] = useState(false)
  const [importJson, setImportJson] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      setImportJson(ev.target?.result as string ?? '')
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    setImportError(null)
    setImportResult(null)

    let parsed: unknown
    try {
      parsed = JSON.parse(importJson)
    } catch {
      setImportError('JSON invalide. Vérifiez la syntaxe.')
      return
    }

    if (!Array.isArray(parsed)) {
      setImportError('Le JSON doit être un tableau (array) d\'objets.')
      return
    }

    setImporting(true)
    let success = 0
    let skipped = 0

    for (const item of parsed) {
      if (
        typeof item !== 'object' ||
        item === null ||
        typeof (item as Record<string, unknown>).name !== 'string' ||
        !(item as Record<string, unknown>).name
      ) {
        skipped++
        continue
      }

      const obj = item as Record<string, unknown>
      const { error } = await supabase.from('personas').insert({
        project_id: projectId,
        name: String(obj.name).trim(),
        age: obj.age != null ? parseInt(String(obj.age)) || null : null,
        job: obj.job ? String(obj.job) : null,
        goals: obj.goals ? String(obj.goals) : null,
        frustrations: obj.frustrations ? String(obj.frustrations) : null,
        behaviors: obj.behaviors ? String(obj.behaviors) : null,
        quote: obj.quote ? String(obj.quote) : null,
        status: obj.status === 'validated' ? 'validated' : 'draft',
      })

      if (error) {
        skipped++
      } else {
        success++
      }
    }

    setImporting(false)
    setImportResult({ success, skipped })

    if (success > 0) {
      // Refresh personas list
      const { data } = await supabase
        .from('personas')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      if (data) setPersonas(data)
    }
  }

  const handleImportClose = () => {
    setImportOpen(false)
    setImportJson('')
    setImportResult(null)
    setImportError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-6">
      <PageHeader
        title="Personas"
        description="Définissez les profils utilisateurs de votre produit"
        action={
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setImportOpen(true)}>
              <Upload className="h-4 w-4 mr-1.5" />
              Importer JSON
            </Button>
            <Button onClick={() => setOpen(true)}>Créer un persona</Button>
          </div>
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
              <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                <Button size="sm" variant="secondary" onClick={() => { setTestPersona(persona); setTestForm(defaultTest) }} className="w-full gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5" /> Créer un test
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
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

      {/* Import dialog */}
      <Dialog open={importOpen} onOpenChange={handleImportClose}>
        <DialogContent title="Importer des personas (JSON)" size="lg">
          <DialogBody className="space-y-4">
            {importResult ? (
              <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 text-[13px] text-[var(--text-primary)]">
                {importResult.skipped === 0 ? (
                  <p className="text-[var(--success)]">
                    {importResult.success} persona{importResult.success > 1 ? 's' : ''} importé{importResult.success > 1 ? 's' : ''} avec succès.
                  </p>
                ) : (
                  <p>
                    <span className="text-[var(--success)]">{importResult.success} importé{importResult.success > 1 ? 's' : ''}</span>
                    {' · '}
                    <span className="text-[var(--text-muted)]">{importResult.skipped} ignoré{importResult.skipped > 1 ? 's' : ''} (champ &ldquo;name&rdquo; manquant ou erreur)</span>
                  </p>
                )}
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                    Fichier JSON
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="w-full text-[13px] text-[var(--text-primary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-[var(--radius-sm)] file:border-0 file:text-[12px] file:font-medium file:bg-[var(--surface-secondary)] file:text-[var(--text-secondary)] hover:file:bg-[var(--surface-hover)] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">
                    Ou collez votre JSON ici
                  </label>
                  <textarea
                    className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[12px] font-mono text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
                    rows={8}
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                    placeholder={EXAMPLE_JSON}
                  />
                </div>

                {importError && (
                  <p className="text-[12px] text-[var(--danger)]">{importError}</p>
                )}

                <details className="text-[12px] text-[var(--text-muted)]">
                  <summary className="cursor-pointer hover:text-[var(--text-secondary)] transition-colors">
                    Voir le format attendu
                  </summary>
                  <pre className="mt-2 rounded-[var(--radius-sm)] bg-[var(--surface-secondary)] p-3 text-[11px] overflow-auto max-h-40">
                    {EXAMPLE_JSON}
                  </pre>
                </details>
              </>
            )}
          </DialogBody>
          <DialogFooter>
            {importResult ? (
              <Button onClick={handleImportClose}>Fermer</Button>
            ) : (
              <>
                <DialogClose asChild>
                  <Button variant="ghost">Annuler</Button>
                </DialogClose>
                <Button
                  onClick={handleImport}
                  disabled={!importJson.trim() || importing}
                >
                  {importing ? 'Importation...' : 'Importer'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Test creation dialog */}
      <Dialog open={!!testPersona} onOpenChange={v => { if (!v) { setTestPersona(null); setTestForm(defaultTest) } }}>
        <DialogContent title={`Créer un test — ${testPersona?.name ?? ''}`} size="lg">
          <DialogBody className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Titre du test *</label>
              <input
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                placeholder="Ex: Test d'utilisabilité onboarding"
                value={testForm.title}
                onChange={e => setTestForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Type de test</label>
              <select
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                value={testForm.test_type}
                onChange={e => setTestForm(f => ({ ...f, test_type: e.target.value }))}
              >
                <option value="interview">Interview</option>
                <option value="usability">Test d&apos;utilisabilité</option>
                <option value="survey">Sondage</option>
                <option value="ab_test">A/B Test</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Objectifs</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={3}
                placeholder="Quels apprentissages souhaitez-vous obtenir ?"
                value={testForm.objectives}
                onChange={e => setTestForm(f => ({ ...f, objectives: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1">Notes</label>
              <textarea
                className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                rows={2}
                value={testForm.notes}
                onChange={e => setTestForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Annuler</Button>
            </DialogClose>
            <Button onClick={handleCreateTest} disabled={!testForm.title.trim() || testSaving}>
              {testSaving ? 'Enregistrement...' : 'Créer le test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
