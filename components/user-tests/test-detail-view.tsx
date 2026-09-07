'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabaseClient } from '@/lib/supabase/client'
import { PageHeader } from '@/components/ui/page-header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { UserTest, Persona, TestResponse, FormField, SyntheticPersona } from '@/lib/types/database'
import { ArrowLeft, Plus, Trash2, Sparkles, ChevronUp, ChevronDown, Check, X } from 'lucide-react'

interface AiAnalysis {
  summary?: string
  pain_points?: Array<{ title: string; description: string; severity: string }>
  insights?: Array<{ title: string; description: string; type: string; confidence: string }>
  key_findings?: string[]
}

interface Props {
  projectId: string
  initialTest: UserTest
  personas: Persona[]
  initialResponses: TestResponse[]
}

const TABS = ['Formulaire', 'Participants', 'Résultats IA'] as const
type Tab = typeof TABS[number]

function randomId() { return Math.random().toString(36).slice(2, 9) }

export function TestDetailView({ projectId, initialTest, personas, initialResponses }: Props) {
  const router = useRouter()
  const supabase = getSupabaseClient()

  const [test, setTest] = useState(initialTest)
  const [tab, setTab] = useState<Tab>('Formulaire')

  // Form builder
  const [fields, setFields] = useState<FormField[]>(() => {
    const raw = initialTest.form_fields
    if (Array.isArray(raw)) return raw as FormField[]
    return []
  })
  const [fieldSaving, setFieldSaving] = useState(false)

  const addField = (type: FormField['type']) => {
    const newField: FormField = { id: randomId(), type, label: '', required: false, options: type === 'radio' || type === 'checkbox' ? [''] : undefined }
    setFields(prev => [...prev, newField])
  }

  const updateField = (id: string, patch: Partial<FormField>) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f))
  }

  const removeField = (id: string) => setFields(prev => prev.filter(f => f.id !== id))

  const moveField = (id: string, dir: -1 | 1) => {
    setFields(prev => {
      const idx = prev.findIndex(f => f.id === id)
      if (idx < 0) return prev
      const next = [...prev]
      const swap = idx + dir
      if (swap < 0 || swap >= next.length) return prev
      ;[next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  const saveForm = async () => {
    setFieldSaving(true)
    await supabase.from('user_tests').update({ form_fields: fields as unknown as never }).eq('id', test.id)
    setFieldSaving(false)
  }

  // Participants
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>(() => {
    const raw = initialTest.persona_ids
    if (Array.isArray(raw)) return raw as string[]
    return []
  })
  const [syntheticPersonas, setSyntheticPersonas] = useState<SyntheticPersona[]>(() => {
    const raw = initialTest.synthetic_personas
    if (Array.isArray(raw)) return raw as SyntheticPersona[]
    return []
  })
  const [generatingCount, setGeneratingCount] = useState(20)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [pendingPersonas, setPendingPersonas] = useState<SyntheticPersona[]>([])
  const [participantSaving, setParticipantSaving] = useState(false)

  const togglePersona = (id: string) => {
    setSelectedPersonaIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const generatePersonas = async () => {
    setGenerating(true); setGenError(''); setPendingPersonas([])
    const res = await fetch('/api/ai/generate-test-personas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, count: generatingCount }),
    })
    const data = await res.json()
    setGenerating(false)
    if (data.error) { setGenError(data.error); return }
    setPendingPersonas(data.personas ?? [])
  }

  const approvePersona = (p: SyntheticPersona) => {
    setSyntheticPersonas(prev => [...prev, p])
    setPendingPersonas(prev => prev.filter(x => x.name !== p.name))
  }

  const rejectPersona = (p: SyntheticPersona) => {
    setPendingPersonas(prev => prev.filter(x => x.name !== p.name))
  }

  const removeSynthetic = (name: string) => {
    setSyntheticPersonas(prev => prev.filter(p => p.name !== name))
  }

  const saveParticipants = async () => {
    setParticipantSaving(true)
    await supabase.from('user_tests').update({
      persona_ids: selectedPersonaIds as unknown as never,
      synthetic_personas: syntheticPersonas as unknown as never,
    }).eq('id', test.id)
    setParticipantSaving(false)
  }

  // AI Analysis
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(() => {
    const raw = initialTest.ai_analysis
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) return raw as AiAnalysis
    return null
  })
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [exportingPP, setExportingPP] = useState(false)
  const [exportingInsights, setExportingInsights] = useState(false)

  const runAnalysis = async () => {
    setAnalyzing(true); setAnalyzeError('')
    const res = await fetch('/api/ai/analyze-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: test.id }),
    })
    const data = await res.json()
    setAnalyzing(false)
    if (data.error) { setAnalyzeError(data.error); return }
    const result: AiAnalysis = data
    setAnalysis(result)
    await supabase.from('user_tests').update({ ai_analysis: result as unknown as never }).eq('id', test.id)
  }

  const exportPainPoints = async () => {
    if (!analysis?.pain_points?.length) return
    setExportingPP(true)
    await Promise.all(analysis.pain_points.map(pp =>
      supabase.from('pain_points').insert({
        project_id: projectId,
        title: pp.title,
        description: pp.description || null,
        severity: pp.severity || 'medium',
        frequency: 'occasional',
        status: 'identified',
      })
    ))
    setExportingPP(false)
    alert(`${analysis.pain_points.length} pain point(s) exporté(s)`)
  }

  const exportInsights = async () => {
    if (!analysis?.insights?.length) return
    setExportingInsights(true)
    await Promise.all(analysis.insights.map(ins =>
      supabase.from('insights').insert({
        project_id: projectId,
        title: ins.title,
        description: ins.description || null,
        type: ins.type || 'observation',
        confidence: ins.confidence || 'low',
      })
    ))
    setExportingInsights(false)
    alert(`${analysis.insights.length} insight(s) exporté(s)`)
  }

  const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]'

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push(`/project/${projectId}/user-tests`)}
          className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">{test.title}</h1>
          {test.objectives && <p className="text-[13px] text-[var(--text-muted)] mt-0.5">{test.objectives}</p>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border-subtle)] mb-6">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 text-[13px] font-medium transition-colors border-b-2 -mb-px',
              tab === t
                ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab: Formulaire */}
      {tab === 'Formulaire' && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {(['text', 'textarea', 'radio', 'checkbox'] as const).map(type => (
              <Button key={type} variant="secondary" size="sm" onClick={() => addField(type)}>
                <Plus className="h-3 w-3" />
                {type === 'text' ? 'Texte court' : type === 'textarea' ? 'Texte long' : type === 'radio' ? 'Boutons radio' : 'Cases à cocher'}
              </Button>
            ))}
          </div>

          {fields.length === 0 && (
            <div className="text-center py-12 rounded-[var(--radius-panel)] border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] text-[13px]">
              Ajoutez des champs pour construire votre formulaire de test
            </div>
          )}

          {fields.map((field, idx) => (
            <div key={field.id} className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveField(field.id, -1)} disabled={idx === 0} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => moveField(field.id, 1)} disabled={idx === fields.length - 1} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="muted">{field.type === 'text' ? 'Texte court' : field.type === 'textarea' ? 'Texte long' : field.type === 'radio' ? 'Radio' : 'Checkbox'}</Badge>
                    <label className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] cursor-pointer">
                      <input type="checkbox" checked={field.required} onChange={e => updateField(field.id, { required: e.target.checked })} />
                      Obligatoire
                    </label>
                  </div>
                  <input
                    className={inputCls}
                    placeholder="Intitulé de la question"
                    value={field.label}
                    onChange={e => updateField(field.id, { label: e.target.value })}
                  />
                  {(field.type === 'radio' || field.type === 'checkbox') && (
                    <div className="space-y-1.5">
                      {(field.options ?? []).map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            className={cn(inputCls, 'flex-1')}
                            placeholder={`Option ${oi + 1}`}
                            value={opt}
                            onChange={e => {
                              const opts = [...(field.options ?? [])]
                              opts[oi] = e.target.value
                              updateField(field.id, { options: opts })
                            }}
                          />
                          <button onClick={() => { const opts = (field.options ?? []).filter((_, i) => i !== oi); updateField(field.id, { options: opts }) }} className="text-[var(--text-muted)] hover:text-[var(--danger)]">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <Button size="sm" variant="ghost" onClick={() => updateField(field.id, { options: [...(field.options ?? []), ''] })}>
                        <Plus className="h-3 w-3" /> Ajouter une option
                      </Button>
                    </div>
                  )}
                </div>
                <button onClick={() => removeField(field.id)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {fields.length > 0 && (
            <Button onClick={saveForm} loading={fieldSaving}>Sauvegarder le formulaire</Button>
          )}
        </div>
      )}

      {/* Tab: Participants */}
      {tab === 'Participants' && (
        <div className="space-y-6">
          {/* Personas existants */}
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Personas existants</p>
            {personas.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">Aucun persona créé pour ce projet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {personas.map(p => (
                  <label
                    key={p.id}
                    className={cn(
                      'flex items-center gap-3 rounded-[var(--radius-panel)] border p-3 cursor-pointer transition-colors',
                      selectedPersonaIds.includes(p.id)
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]'
                        : 'border-[var(--border-subtle)] bg-[var(--surface-primary)] hover:bg-[var(--surface-secondary)]',
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPersonaIds.includes(p.id)}
                      onChange={() => togglePersona(p.id)}
                      className="accent-[var(--accent-primary)]"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{p.name}</p>
                      {p.job && <p className="text-[12px] text-[var(--text-muted)] truncate">{p.job}</p>}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Personas synthétiques */}
          <div>
            <p className="text-[14px] font-semibold text-[var(--text-primary)] mb-3">Personas synthétiques (IA)</p>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <label className="text-[12px] text-[var(--text-secondary)]">Nombre :</label>
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={generatingCount}
                  onChange={e => setGeneratingCount(parseInt(e.target.value) || 20)}
                  className="w-20 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2 py-1.5 text-[13px] text-[var(--text-primary)] text-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]"
                />
              </div>
              <Button variant="secondary" size="sm" loading={generating} onClick={generatePersonas}>
                <Sparkles className="h-3.5 w-3.5" /> Générer {generatingCount} personas IA
              </Button>
            </div>
            {genError && <p className="text-[12px] text-[var(--danger)] mb-2">{genError}</p>}

            {/* Personas en attente d'approbation */}
            {pendingPersonas.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">En attente d'approbation</p>
                {pendingPersonas.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{p.name}, {p.age} ans — {p.job}</p>
                      <p className="text-[12px] text-[var(--text-muted)] mt-0.5 line-clamp-2">{p.profile}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(p.skills).map(([k, v]) => (
                          <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-[var(--surface-primary)] border border-[var(--border-subtle)] text-[var(--text-muted)]">
                            {k}: {v}/5
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => approvePersona(p)} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--success-muted)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white transition-colors">
                        <Check className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => rejectPersona(p)} className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--danger-muted)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white transition-colors">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Personas synthétiques approuvés */}
            {syntheticPersonas.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wide">Approuvés ({syntheticPersonas.length})</p>
                {syntheticPersonas.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{p.name}, {p.age} ans — {p.job}</p>
                    </div>
                    <button onClick={() => removeSynthetic(p.name)} className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button onClick={saveParticipants} loading={participantSaving}>
            Sauvegarder les participants
          </Button>
        </div>
      )}

      {/* Tab: Résultats IA */}
      {tab === 'Résultats IA' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="secondary" loading={analyzing} onClick={runAnalysis}>
              <Sparkles className="h-3.5 w-3.5" /> Analyser les résultats avec l&apos;IA
            </Button>
            {analyzeError && <p className="text-[12px] text-[var(--danger)]">{analyzeError}</p>}
          </div>

          {!analysis ? (
            <div className="text-center py-12 rounded-[var(--radius-panel)] border border-dashed border-[var(--border-subtle)] text-[var(--text-muted)] text-[13px]">
              L&apos;IA simulera des réponses à partir des profils participants et de votre formulaire, puis extraira les pain points et insights clés.
            </div>
          ) : (
            <div className="space-y-6">
              {analysis.summary && (
                <div className="rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Résumé</p>
                  <p className="text-[14px] text-[var(--text-primary)] leading-relaxed">{analysis.summary}</p>
                </div>
              )}

              {analysis.key_findings && analysis.key_findings.length > 0 && (
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">Points clés</p>
                  <ul className="space-y-1.5">
                    {analysis.key_findings.map((f, i) => (
                      <li key={i} className="flex gap-2 text-[13px] text-[var(--text-secondary)]">
                        <span className="text-[var(--accent-primary)] shrink-0">·</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {analysis.pain_points && analysis.pain_points.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Pain Points détectés ({analysis.pain_points.length})</p>
                    <Button size="sm" variant="secondary" loading={exportingPP} onClick={exportPainPoints}>Exporter vers Pain Points</Button>
                  </div>
                  <div className="space-y-2">
                    {analysis.pain_points.map((pp, i) => (
                      <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[13px] font-medium text-[var(--text-primary)]">{pp.title}</p>
                          <Badge variant={pp.severity === 'critical' ? 'danger' : pp.severity === 'high' ? 'warning' : 'muted'}>{pp.severity}</Badge>
                        </div>
                        <p className="text-[12px] text-[var(--text-secondary)]">{pp.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysis.insights && analysis.insights.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Insights ({analysis.insights.length})</p>
                    <Button size="sm" variant="secondary" loading={exportingInsights} onClick={exportInsights}>Exporter vers Insights</Button>
                  </div>
                  <div className="space-y-2">
                    {analysis.insights.map((ins, i) => (
                      <div key={i} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
                        <p className="text-[13px] font-medium text-[var(--text-primary)] mb-1">{ins.title}</p>
                        <p className="text-[12px] text-[var(--text-secondary)]">{ins.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
