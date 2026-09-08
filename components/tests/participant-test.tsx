'use client'

import { useEffect, useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Block {
  id: string
  block_type: string
  position: number
  config: Record<string, unknown> | null
}

interface TestData {
  id: string
  title: string
  intro_text: string | null
  closing_text: string | null
  estimated_minutes: number | null
  blocks: Block[]
}

type Step = 'welcome' | 'consent' | 'blocks' | 'thanks'

interface Props { publicToken: string }

export function ParticipantTest({ publicToken }: Props) {
  const [test, setTest] = useState<TestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('welcome')
  const [blockIndex, setBlockIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch(`/api/public-tests/${publicToken}`)
      .then(r => r.json())
      .then(d => { if (d.error) { setError(d.error) } else { setTest(d.test) } })
      .catch(() => setError('Erreur de chargement'))
      .finally(() => setLoading(false))
  }, [publicToken])

  const handleSubmit = async () => {
    if (!test) return
    setSubmitting(true)
    await fetch(`/api/public-tests/${publicToken}/responses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participantName: name || null,
        participantEmail: email || null,
        responses: Object.entries(answers).map(([blockId, answer]) => ({ blockId, answer })),
      }),
    })
    setSubmitting(false)
    setStep('thanks')
  }

  const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-500'

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Chargement...</p></div>
  if (error) return <div className="min-h-screen flex items-center justify-center"><p className="text-red-500">{error}</p></div>
  if (!test) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        {step === 'welcome' && (
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            {test.intro_text && <p className="text-gray-600 text-sm">{test.intro_text}</p>}
            {test.estimated_minutes && <p className="text-gray-400 text-xs">Durée estimée: {test.estimated_minutes} minutes</p>}
            <button onClick={() => setStep('consent')} className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">Commencer</button>
          </div>
        )}

        {step === 'consent' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Informations (optionnel)</h2>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Prénom</label><input className={inputCls} placeholder="Votre prénom" value={name} onChange={e => setName(e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-gray-500 mb-1">Email</label><input type="email" className={inputCls} placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} /></div>
            <p className="text-xs text-gray-400">Vos réponses sont anonymisées et utilisées uniquement à des fins de recherche.</p>
            <div className="flex gap-2">
              <button onClick={() => setStep('welcome')} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Retour</button>
              <button onClick={() => setStep('blocks')} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Continuer</button>
            </div>
          </div>
        )}

        {step === 'blocks' && test.blocks.length > 0 && (() => {
          const block = test.blocks[blockIndex]
          const cfg = block.config ?? {}
          return (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Question {blockIndex + 1} / {test.blocks.length}</span>
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{(cfg.title as string) ?? block.block_type}</h2>
              {(cfg.instructions as string) && <p className="text-sm text-gray-600">{cfg.instructions as string}</p>}
              {(block.block_type === 'open_text' || block.block_type === 'question') && (
                <textarea
                  className={cn(inputCls, 'resize-none h-28')}
                  placeholder="Votre réponse..."
                  value={(answers[block.id] as string) ?? ''}
                  onChange={e => setAnswers(prev => ({ ...prev, [block.id]: e.target.value }))}
                />
              )}
              {block.block_type === 'rating' && (
                <div className="flex gap-2 justify-center">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => setAnswers(prev => ({ ...prev, [block.id]: n }))}
                      className={cn('h-10 w-10 rounded-full border-2 text-sm font-medium transition-colors', answers[block.id] === n ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-200 hover:border-blue-300')}
                    >{n}</button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {blockIndex > 0 && <button onClick={() => setBlockIndex(i => i - 1)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm hover:bg-gray-50">Précédent</button>}
                {blockIndex < test.blocks.length - 1 ? (
                  <button onClick={() => setBlockIndex(i => i + 1)} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Suivant</button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Envoi...' : 'Terminer'}</button>
                )}
              </div>
            </div>
          )
        })()}

        {step === 'blocks' && test.blocks.length === 0 && (
          <div className="text-center space-y-4">
            <p className="text-gray-500 text-sm">Ce test n&apos;a pas encore de questions.</p>
            <button onClick={handleSubmit} disabled={submitting} className="w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">{submitting ? 'Envoi...' : 'Terminer'}</button>
          </div>
        )}

        {step === 'thanks' && (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Merci !</h2>
            <p className="text-gray-600 text-sm">{test.closing_text ?? 'Vos réponses ont bien été enregistrées.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}
