'use client'

import { useState } from 'react'
import { NotebookPen, Sparkles, CheckCircle2, AlertCircle, XCircle, Plus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'

interface PainPoint { id: string; title: string; description: string | null; status: string; severity: string | null }
interface Insight { id: string; statement: string; observation: string | null; status: string }

interface AnalysisItem {
  id: string
  type: 'pain_point' | 'insight'
  title: string
  verdict: 'confirmed' | 'unverified' | 'contradicted'
  justification: string
  quote: string | null
}

interface SuggestedItem {
  type: 'pain_point' | 'insight'
  title: string
  description: string
  quote: string | null
}

interface AnalysisResult {
  summary: string
  items: AnalysisItem[]
  suggestions: SuggestedItem[]
}

interface Props {
  productId: string
  userId: string
  painPoints: PainPoint[]
  insights: Insight[]
}

const VERDICT_CONFIG = {
  confirmed:    { label: 'Confirmé',    icon: CheckCircle2, color: 'text-[var(--success)]',  bg: 'bg-[var(--success)]/10',  border: 'border-[var(--success)]/30' },
  unverified:   { label: 'Non étayé',  icon: AlertCircle,  color: 'text-[var(--warning)]',  bg: 'bg-[var(--warning)]/10',  border: 'border-[var(--warning)]/30' },
  contradicted: { label: 'Contredit',  icon: XCircle,      color: 'text-[var(--danger)]',   bg: 'bg-[var(--danger)]/10',   border: 'border-[var(--danger)]/30'  },
}

export function ResearchView({ productId, userId, painPoints, insights }: Props) {
  const [text, setText] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<number>>(new Set())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 50) {
      setError('Veuillez saisir au moins 50 caractères de notes.')
      return
    }
    setAnalyzing(true)
    setError(null)
    setResult(null)
    setImported(new Set())

    try {
      const res = await fetch('/api/ai/analyze-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, productId, painPoints, insights }),
      })
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur serveur')
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(String(err))
    } finally {
      setAnalyzing(false)
    }
  }

  const importSuggestion = async (item: SuggestedItem, idx: number) => {
    setImporting(String(idx))
    const supabase = getSupabaseClient()

    if (item.type === 'pain_point') {
      await supabase.from('pain_points').insert({
        user_id: userId,
        product_id: productId,
        title: item.title,
        description: item.description,
        status: 'candidate',
        source: 'ai',
      })
    } else {
      await supabase.from('insights').insert({
        user_id: userId,
        product_id: productId,
        statement: item.title,
        observation: item.description,
        status: 'candidate',
        source: 'ai',
      })
    }

    setImported(prev => new Set([...prev, idx]))
    setImporting(null)
  }

  const confirmedCount = result?.items.filter(i => i.verdict === 'confirmed').length ?? 0
  const unverifiedCount = result?.items.filter(i => i.verdict === 'unverified').length ?? 0
  const contradictedCount = result?.items.filter(i => i.verdict === 'contradicted').length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <NotebookPen className="h-5 w-5 text-[var(--accent-primary)]" />
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Recueil de terrain</h1>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Collez vos notes d&apos;entretiens, verbatims ou observations. L&apos;IA vérifie la cohérence avec vos pain points et insights existants.
        </p>
      </div>

      {/* Text input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Notes de recherche</label>
          <span className="text-xs text-[var(--text-muted)]">{text.length} caractères</span>
        </div>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(null) }}
          placeholder={`Collez ici vos notes brutes : verbatims d'entretiens, observations terrain, retours utilisateurs...

Exemple :
"L'utilisateur dit qu'il perd beaucoup de temps à rechercher les informations..."
"Lors de la démo, 3 participants sur 5 n'ont pas trouvé le bouton d'export..."
"Frustration récurrente : l'onboarding est trop long et peu guidé."`}
          rows={12}
          className="w-full rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)] resize-y leading-relaxed"
        />

        {error && (
          <div className="flex items-center gap-2 text-sm text-[var(--danger)]">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="text-xs text-[var(--text-muted)]">
            {painPoints.length} pain point{painPoints.length !== 1 ? 's' : ''} · {insights.length} insight{insights.length !== 1 ? 's' : ''} analysés
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || text.trim().length < 50}
            className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {analyzing ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Analyse en cours...</>
            ) : (
              <><Sparkles className="h-4 w-4" />Analyser</>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--accent-muted)] border border-[var(--accent-primary)]/20">
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-[var(--accent-primary)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--text-primary)] leading-relaxed">{result.summary}</p>
            </div>
          </div>

          {/* Scoreboard */}
          {result.items.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Confirmés', count: confirmedCount, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10' },
                { label: 'Non étayés', count: unverifiedCount, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10' },
                { label: 'Contredits', count: contradictedCount, color: 'text-[var(--danger)]', bg: 'bg-[var(--danger)]/10' },
              ].map(s => (
                <div key={s.label} className={cn('rounded-[var(--radius-lg)] p-3 text-center', s.bg)}>
                  <p className={cn('text-2xl font-bold', s.color)}>{s.count}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Existing items analysis */}
          {result.items.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Analyse de l&apos;existant</h2>
              <div className="space-y-2">
                {result.items.map(item => {
                  const cfg = VERDICT_CONFIG[item.verdict]
                  const Icon = cfg.icon
                  const isOpen = expanded.has(item.id)
                  return (
                    <div key={item.id} className={cn('rounded-[var(--radius-lg)] border overflow-hidden', cfg.border)}>
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className={cn('w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-secondary)]', cfg.bg)}
                      >
                        <Icon className={cn('h-4 w-4 shrink-0', cfg.color)} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                              {item.type === 'pain_point' ? 'Pain Point' : 'Insight'}
                            </span>
                            <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', cfg.bg, cfg.color)}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-[var(--text-primary)] truncate mt-0.5">{item.title}</p>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="h-4 w-4 text-[var(--text-muted)] shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 border-t border-[var(--border-subtle)] bg-[var(--surface-primary)] space-y-2">
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{item.justification}</p>
                          {item.quote && (
                            <blockquote className="border-l-2 border-[var(--accent-primary)]/40 pl-3 italic text-sm text-[var(--text-muted)]">
                              &ldquo;{item.quote}&rdquo;
                            </blockquote>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                Nouveaux éléments détectés ({result.suggestions.length})
              </h2>
              <div className="space-y-2">
                {result.suggestions.map((sug, idx) => {
                  const isImported = imported.has(idx)
                  const isLoading = importing === String(idx)
                  return (
                    <div key={idx} className="rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                              {sug.type === 'pain_point' ? 'Pain Point' : 'Insight'}
                            </span>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-primary)] font-medium">
                              Nouveau
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{sug.title}</p>
                          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{sug.description}</p>
                          {sug.quote && (
                            <blockquote className="mt-2 border-l-2 border-[var(--accent-primary)]/40 pl-3 italic text-sm text-[var(--text-muted)]">
                              &ldquo;{sug.quote}&rdquo;
                            </blockquote>
                          )}
                        </div>
                        <button
                          onClick={() => importSuggestion(sug, idx)}
                          disabled={isImported || isLoading}
                          className={cn(
                            'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-medium transition-all',
                            isImported
                              ? 'bg-[var(--success)]/10 text-[var(--success)] cursor-default'
                              : 'border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] disabled:opacity-50',
                          )}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isImported ? (
                            <><CheckCircle2 className="h-3.5 w-3.5" />Importé</>
                          ) : (
                            <><Plus className="h-3.5 w-3.5" />Importer</>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {result.items.length === 0 && result.suggestions.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              Aucun élément analysé — vérifiez que vous avez des pain points ou insights enregistrés.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
