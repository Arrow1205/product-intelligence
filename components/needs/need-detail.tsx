'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Brain, ChevronLeft, CheckCircle, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { NeedExpression, AiAnalysis } from '@/lib/types/database'

interface Props { need: NeedExpression; analyses: AiAnalysis[]; productId: string }

const fieldCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-none'
const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1'

export function NeedDetail({ need: initialNeed, analyses: initialAnalyses, productId }: Props) {
  const router = useRouter()
  const [need, setNeed] = useState(initialNeed)
  const [analyses, setAnalyses] = useState(initialAnalyses)
  const [saving, setSaving] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [selectedAnalysis, setSelectedAnalysis] = useState<AiAnalysis | null>(analyses[0] ?? null)

  const update = (field: keyof NeedExpression, value: string) => setNeed(prev => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    const supabase = getSupabaseClient()
    await supabase.from('need_expressions').update({ title: need.title, body: need.body, context: need.context, business_objectives: need.business_objectives, known_users: need.known_users, constraints: need.constraints, open_questions: need.open_questions, updated_at: new Date().toISOString() }).eq('id', need.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    const res = await fetch('/api/ai/analyze-need', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ needId: need.id }) })
    const data = await res.json()
    setAnalyzing(false)
    if (data.analysis) {
      setAnalyses(prev => [data.analysis, ...prev])
      setSelectedAnalysis(data.analysis)
    }
  }

  const result = selectedAnalysis?.result as Record<string, unknown> | null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push(`/products/${productId}/needs`)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)] flex-1 truncate">{need.title}</h1>
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] disabled:opacity-50 transition-colors">
            {saved ? <CheckCircle className="h-4 w-4 text-[var(--success)]" /> : <Save className="h-4 w-4" />}
            {saved ? 'Sauvegardé' : saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button onClick={handleAnalyze} disabled={analyzing} className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
            <Brain className="h-4 w-4" />
            {analyzing ? 'Analyse...' : 'Analyser avec l\'IA'}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Titre</label>
            <input className={cn(fieldCls, 'resize-none')} value={need.title} onChange={e => update('title', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Description du besoin</label>
            <textarea className={fieldCls} rows={5} placeholder="Décrivez le besoin en détail..." value={need.body ?? ''} onChange={e => update('body', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Contexte</label>
            <textarea className={fieldCls} rows={3} placeholder="Contexte business, marché..." value={need.context ?? ''} onChange={e => update('context', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Objectifs business</label>
            <textarea className={fieldCls} rows={3} placeholder="KPIs, métriques visées..." value={need.business_objectives ?? ''} onChange={e => update('business_objectives', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Utilisateurs connus</label>
            <textarea className={fieldCls} rows={2} placeholder="Profils, segments..." value={need.known_users ?? ''} onChange={e => update('known_users', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Contraintes</label>
            <textarea className={fieldCls} rows={2} placeholder="Technique, légal, budget..." value={need.constraints ?? ''} onChange={e => update('constraints', e.target.value)} />
          </div>
          <div>
            <label className={labelCls}>Questions ouvertes</label>
            <textarea className={fieldCls} rows={2} placeholder="Ce qu'on ne sait pas encore..." value={need.open_questions ?? ''} onChange={e => update('open_questions', e.target.value)} />
          </div>
        </div>

        <div className="space-y-4">
          {analyses.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Analyses IA ({analyses.length})</h2>
                {analyses.length > 1 && (
                  <select className="text-xs border border-[var(--border-subtle)] rounded-[var(--radius-md)] px-2 py-1 bg-[var(--surface-primary)] text-[var(--text-secondary)]" onChange={e => setSelectedAnalysis(analyses[parseInt(e.target.value)] ?? null)}>
                    {analyses.map((a, i) => <option key={a.id} value={i}>{new Date(a.created_at).toLocaleString('fr')}</option>)}
                  </select>
                )}
              </div>
              {selectedAnalysis && result && <AnalysisResult result={result} />}
            </>
          )}
          {analyses.length === 0 && !analyzing && (
            <div className="flex flex-col items-center py-12 text-center border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-lg)]">
              <Brain className="h-8 w-8 text-[var(--text-muted)] mb-2" />
              <p className="text-sm text-[var(--text-muted)]">Cliquez sur "Analyser avec l'IA" pour obtenir une analyse structurée de ce besoin.</p>
            </div>
          )}
          {analyzing && (
            <div className="flex flex-col items-center py-12 text-center">
              <Clock className="h-8 w-8 text-[var(--accent-primary)] animate-spin mb-2" />
              <p className="text-sm text-[var(--text-muted)]">Analyse en cours...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AnalysisResult({ result }: { result: Record<string, unknown> }) {
  const section = (title: string, content: React.ReactNode) => (
    <div className="rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] p-4 space-y-2">
      <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">{title}</h3>
      {content}
    </div>
  )

  const riskColor = (r: string) => r === 'high' ? 'var(--danger)' : r === 'medium' ? 'var(--warning)' : 'var(--success)'

  return (
    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-200px)]">
      {!!(result as Record<string, unknown>).summary && section('Résumé', <p className="text-sm text-[var(--text-primary)]">{String((result as Record<string, unknown>).summary)}</p>)}
      {!!(result as Record<string, unknown>).problem_statement && section('Problème', <p className="text-sm text-[var(--text-primary)]">{String((result as Record<string, unknown>).problem_statement)}</p>)}
      {Array.isArray(result.target_users) && result.target_users.length > 0 && section('Utilisateurs cibles', (
        <div className="space-y-2">
          {(result.target_users as Array<{label: string; description: string; confidence: string}>).map((u, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs font-medium text-[var(--accent-primary)] shrink-0">{u.confidence}</span>
              <div><p className="text-sm font-medium text-[var(--text-primary)]">{u.label}</p><p className="text-xs text-[var(--text-secondary)]">{u.description}</p></div>
            </div>
          ))}
        </div>
      ))}
      {Array.isArray(result.assumptions) && result.assumptions.length > 0 && section('Hypothèses', (
        <div className="space-y-1">
          {(result.assumptions as Array<{statement: string; risk: string}>).map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: riskColor(a.risk) }} />
              <span className="text-[var(--text-primary)]">{a.statement}</span>
            </div>
          ))}
        </div>
      ))}
      {Array.isArray(result.recommended_tests) && result.recommended_tests.length > 0 && section('Tests recommandés', (
        <div className="space-y-2">
          {(result.recommended_tests as Array<{title: string; method: string; priority: string}>).map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-xs shrink-0" style={{ color: riskColor(t.priority) }}>{t.priority}</span>
              <div><p className="text-sm font-medium text-[var(--text-primary)]">{t.title}</p><p className="text-xs text-[var(--text-secondary)]">{t.method}</p></div>
            </div>
          ))}
        </div>
      ))}
      {Array.isArray(result.next_steps) && result.next_steps.length > 0 && section('Prochaines étapes', (
        <ul className="space-y-1">
          {(result.next_steps as string[]).map((s, i) => <li key={i} className="text-sm text-[var(--text-primary)] flex gap-2"><span className="text-[var(--text-muted)]">{i+1}.</span>{s}</li>)}
        </ul>
      ))}
    </div>
  )
}
