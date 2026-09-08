'use client'

import { useState } from 'react'
import { Star, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Block {
  id: string
  block_type: string
  position: number
  config: Record<string, unknown>
}

interface TestData {
  id: string
  title: string
  intro_text?: string | null
  closing_text?: string | null
  estimated_minutes?: number | null
  public_token: string
  logo_url?: string | null
  bg_color?: string | null
  blocks: Block[]
}

interface Props { test: TestData }

export function ParticipantTest({ test }: Props) {
  const [step, setStep] = useState<'welcome' | 'consent' | 'blocks' | 'done'>('welcome')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [age, setAge] = useState('')
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [blockIdx, setBlockIdx] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeBlocks = test.blocks ?? []
  const bgColor = test.bg_color ?? '#f8fafc'

  const setAnswer = (blockId: string, value: unknown) => {
    setAnswers(prev => ({ ...prev, [blockId]: value }))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const responses = Object.entries(answers).map(([blockId, value]) => ({ blockId, answer: { value } }))
      const res = await fetch(`/api/public-tests/${test.public_token}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: name || null,
          participantEmail: email || null,
          participantJobTitle: jobTitle || null,
          participantAge: age ? parseInt(age, 10) : null,
          responses,
        }),
      })
      if (!res.ok) throw new Error('Erreur lors de l\'envoi')
      setStep('done')
    } catch (err) {
      setError(String(err))
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-white px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]'

  const Logo = test.logo_url ? (
    <img src={test.logo_url} alt="Logo" className="h-10 w-auto object-contain mx-auto mb-4" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
  ) : null

  // ── WELCOME ───────────────────────────────────────────────────────────────
  if (step === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-lg)]">
          {Logo}
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">{test.title}</h1>
          {test.estimated_minutes && (
            <p className="text-sm text-[var(--text-muted)] mb-4">Durée estimée : {test.estimated_minutes} min</p>
          )}
          {test.intro_text ? (
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">{test.intro_text}</p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)] mb-6">Merci de participer à cette étude. Vos réponses nous aideront à améliorer notre produit.</p>
          )}
          <p className="text-xs text-[var(--text-muted)] mb-6">Ce test comporte {activeBlocks.filter(b => b.block_type !== 'instructions').length} question{activeBlocks.filter(b => b.block_type !== 'instructions').length > 1 ? 's' : ''}.</p>
          <button onClick={() => setStep('consent')} className="w-full py-3 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity">
            Commencer
          </button>
        </div>
      </div>
    )
  }

  // ── CONSENT ───────────────────────────────────────────────────────────────
  if (step === 'consent') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-lg)]">
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-1">Vos informations</h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">Ces informations sont optionnelles et restent confidentielles.</p>
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Nom (optionnel)</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Votre nom" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Poste (optionnel)</label>
              <input className={inputCls} value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Votre poste ou fonction" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Âge (optionnel)</label>
              <input className={inputCls} type="number" min="10" max="120" value={age} onChange={e => setAge(e.target.value)} placeholder="Votre âge" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email (optionnel)</label>
              <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('welcome')} className="flex-1 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
              Retour
            </button>
            <button onClick={() => setStep('blocks')} className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 transition-opacity">
              Continuer
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (step === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
        <div className="w-full max-w-lg bg-white rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-lg)] text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--success)]/20 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-[var(--success)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Merci !</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            {test.closing_text ?? 'Vos réponses ont bien été enregistrées. Merci pour votre participation !'}
          </p>
        </div>
      </div>
    )
  }

  // ── BLOCKS ────────────────────────────────────────────────────────────────
  const currentBlock = activeBlocks[blockIdx]
  if (!currentBlock) return null

  const isLast = blockIdx === activeBlocks.length - 1
  const cfg = (currentBlock.config ?? {}) as Record<string, unknown>

  const goNext = () => {
    if (isLast) handleSubmit()
    else setBlockIdx(i => i + 1)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: bgColor }}>
      <div className="w-full max-w-lg">
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs mb-1" style={{ color: isLightColor(bgColor) ? '#64748b' : '#cbd5e1' }}>
            <span>{blockIdx + 1} / {activeBlocks.length}</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: isLightColor(bgColor) ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)' }}>
            <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all" style={{ width: `${((blockIdx + 1) / activeBlocks.length) * 100}%` }} />
          </div>
        </div>

        {/* Block card — always white */}
        <div className="bg-white rounded-[var(--radius-xl)] border border-[var(--border-subtle)] p-8 shadow-[var(--shadow-lg)]">
          <BlockInput
            block={currentBlock}
            cfg={cfg}
            value={answers[currentBlock.id]}
            onChange={v => setAnswer(currentBlock.id, v)}
          />

          {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}

          <div className="flex gap-3 mt-6">
            {blockIdx > 0 && (
              <button onClick={() => setBlockIdx(i => i - 1)} className="px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">
                Précédent
              </button>
            )}
            <button
              onClick={goNext}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? 'Envoi...' : isLast ? 'Terminer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function isLightColor(hex: string) {
  try {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
  } catch { return true }
}

// ─── Block input renderer ─────────────────────────────────────────────────

function BlockInput({ block, cfg, value, onChange }: {
  block: Block
  cfg: Record<string, unknown>
  value: unknown
  onChange: (v: unknown) => void
}) {
  const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]'

  if (block.block_type === 'instructions') {
    return <p className="text-sm text-[var(--text-primary)] leading-relaxed">{(cfg.text as string) || ''}</p>
  }

  const question = (cfg.question as string) || ''

  if (block.block_type === 'open_text') {
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-3">{question}</p>
        <input
          className={inputCls}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={(cfg.placeholder as string) || 'Votre réponse...'}
        />
      </div>
    )
  }

  if (block.block_type === 'textarea') {
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-3">{question}</p>
        <textarea
          className={cn(inputCls, 'resize-none')}
          rows={4}
          value={(value as string) ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder={(cfg.placeholder as string) || 'Votre réponse...'}
        />
      </div>
    )
  }

  if (block.block_type === 'single_choice') {
    const options = (cfg.options as string[]) ?? []
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-3">{question}</p>
        <div className="space-y-2">
          {options.map(opt => (
            <button key={opt} onClick={() => onChange(opt)}
              className={cn('w-full text-left px-4 py-3 rounded-[var(--radius-md)] border text-sm transition-colors',
                value === opt ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)] text-[var(--accent-primary)] font-medium' : 'border-[var(--border-subtle)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50')}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (block.block_type === 'multi_choice') {
    const options = (cfg.options as string[]) ?? []
    const selected = (value as string[]) ?? []
    const toggle = (opt: string) => {
      const next = selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
      onChange(next)
    }
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-3">{question}</p>
        <div className="space-y-2">
          {options.map(opt => (
            <button key={opt} onClick={() => toggle(opt)}
              className={cn('w-full text-left px-4 py-3 rounded-[var(--radius-md)] border text-sm transition-colors flex items-center gap-3',
                selected.includes(opt) ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50')}
            >
              <div className={cn('w-4 h-4 rounded-[var(--radius-sm)] border-2 flex items-center justify-center shrink-0',
                selected.includes(opt) ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]' : 'border-[var(--border-subtle)]')}>
                {selected.includes(opt) && <Check className="h-2.5 w-2.5 text-white" />}
              </div>
              <span className={selected.includes(opt) ? 'text-[var(--accent-primary)] font-medium' : 'text-[var(--text-primary)]'}>{opt}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (block.block_type === 'rating_5') {
    const rating = (value as number) ?? 0
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-4">{question}</p>
        <div className="flex gap-2 justify-center">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => onChange(n)}
              className="w-12 h-12 rounded-full transition-transform hover:scale-110"
            >
              <Star className={cn('h-8 w-8', rating >= n ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--border-strong)]')} />
            </button>
          ))}
        </div>
        {rating > 0 && <p className="text-center text-sm text-[var(--text-muted)] mt-2">{rating} / 5</p>}
      </div>
    )
  }

  if (block.block_type === 'rating_10') {
    const rating = (value as number) ?? 0
    return (
      <div>
        <p className="text-base font-medium text-[var(--text-primary)] mb-4">{question}</p>
        <div className="flex gap-1.5 justify-between">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
            <button key={n} onClick={() => onChange(n)}
              className={cn('flex-1 h-10 rounded-[var(--radius-md)] text-sm font-bold transition-colors border',
                rating === n ? 'bg-[var(--accent-primary)] text-white border-[var(--accent-primary)]' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)]')}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1 px-1">
          <span>Pas du tout</span><span>Tout à fait</span>
        </div>
      </div>
    )
  }

  return <p className="text-sm text-[var(--text-muted)]">Type de bloc inconnu : {block.block_type}</p>
}
