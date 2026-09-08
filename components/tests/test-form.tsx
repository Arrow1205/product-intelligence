'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'

interface Props { productId: string; userId: string }

const TEST_TYPES = [
  { value: 'usability', label: 'Test d\'utilisabilité' },
  { value: 'concept', label: 'Test de concept' },
  { value: 'survey', label: 'Questionnaire' },
  { value: 'interview', label: 'Entretien guidé' },
]

const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]'
const labelCls = 'block text-xs font-medium text-[var(--text-secondary)] mb-1'

export function TestForm({ productId, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [testType, setTestType] = useState('usability')
  const [objective, setObjective] = useState('')
  const [context, setContext] = useState('')
  const [targetDescription, setTargetDescription] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState('20')
  const [saving, setSaving] = useState(false)

  const steps = ['Informations', 'Protocole', 'Participants']

  const handleCreate = async () => {
    if (!title.trim()) return
    setSaving(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('tests').insert({
      user_id: userId, product_id: productId, title: title.trim(), test_type: testType,
      objective: objective.trim() || null, context: context.trim() || null,
      target_description: targetDescription.trim() || null,
      estimated_minutes: parseInt(estimatedMinutes) || null, status: 'draft',
    }).select().single()
    setSaving(false)
    if (data) router.push(`/products/${productId}/tests/${data.id}`)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push(`/products/${productId}/tests`)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-bold text-[var(--text-primary)]">Nouveau test</h1>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <button onClick={() => i < step && setStep(i)} className={cn('flex items-center gap-1.5 text-sm', i === step ? 'text-[var(--accent-primary)] font-medium' : i < step ? 'text-[var(--text-secondary)] cursor-pointer' : 'text-[var(--text-muted)] cursor-default')}>
              <span className={cn('h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold', i === step ? 'bg-[var(--accent-primary)] text-white' : i < step ? 'bg-[var(--success)] text-white' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]')}>{i + 1}</span>
              {s}
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {step === 0 && (
          <>
            <div><label className={labelCls}>Titre du test *</label><input className={inputCls} placeholder="Ex: Test d'utilisabilité onboarding" value={title} onChange={e => setTitle(e.target.value)} /></div>
            <div><label className={labelCls}>Type de test</label><select className={inputCls} value={testType} onChange={e => setTestType(e.target.value)}>{TEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className={labelCls}>Objectif</label><textarea className={cn(inputCls, 'resize-none')} rows={3} placeholder="Que cherchez-vous à apprendre ?" value={objective} onChange={e => setObjective(e.target.value)} /></div>
          </>
        )}
        {step === 1 && (
          <>
            <div><label className={labelCls}>Contexte</label><textarea className={cn(inputCls, 'resize-none')} rows={4} placeholder="Contexte du test, ce que le participant doit savoir..." value={context} onChange={e => setContext(e.target.value)} /></div>
            <div><label className={labelCls}>Durée estimée (minutes)</label><input type="number" className={inputCls} value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} /></div>
          </>
        )}
        {step === 2 && (
          <>
            <div><label className={labelCls}>Description des participants cibles</label><textarea className={cn(inputCls, 'resize-none')} rows={4} placeholder="Profil, critères de recrutement..." value={targetDescription} onChange={e => setTargetDescription(e.target.value)} /></div>
          </>
        )}
      </div>

      <div className="flex gap-2 mt-8">
        {step > 0 && <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">Précédent</button>}
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!title.trim()} className="ml-auto px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">Suivant</button>
        ) : (
          <button onClick={handleCreate} disabled={saving || !title.trim()} className="ml-auto px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">{saving ? 'Création...' : 'Créer le test'}</button>
        )}
      </div>
    </div>
  )
}
