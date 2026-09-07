'use client'

import { useState, useRef, useEffect } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils/cn'
import type { AiConversation } from '@/lib/types/database'
import { Sparkles, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  projectId: string
  initialConversations: AiConversation[]
}

type Message = { role: 'user' | 'assistant'; content: string; id?: string }

export function AskView({ projectId, initialConversations }: Props) {
  const [messages, setMessages] = useState<Message[]>(
    initialConversations.flatMap(c => [
      { role: 'user' as const, content: c.question, id: c.id + '-q' },
      { role: 'assistant' as const, content: c.answer, id: c.id + '-a' },
    ])
  )
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = getSupabaseClient()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const question = input.trim()
    if (!question || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, projectId }),
      })
      const data = await res.json()
      const answer = data.answer || data.error || 'Erreur lors de la réponse.'
      setMessages(prev => [...prev, { role: 'assistant', content: answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Veuillez réessayer.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-56px)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--accent-primary)]" />
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Ask AI</h1>
        </div>
        <p className="text-[13px] text-[var(--text-secondary)] mt-0.5">Posez des questions sur votre produit, vos utilisateurs ou votre stratégie.</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-12 w-12 rounded-full bg-[var(--accent-muted)] flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-[var(--accent-primary)]" />
            </div>
            <p className="text-[15px] font-medium text-[var(--text-primary)] mb-1">Bienvenue dans Ask AI</p>
            <p className="text-[13px] text-[var(--text-secondary)] max-w-sm">
              Posez-moi une question sur votre produit, vos utilisateurs ou votre stratégie.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={msg.id ?? i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-[var(--accent-muted)] flex items-center justify-center shrink-0 mr-2 mt-1">
                <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[75%] rounded-[var(--radius-lg)] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
                msg.role === 'user'
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--surface-secondary)] text-[var(--text-primary)]',
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="h-7 w-7 rounded-full bg-[var(--accent-muted)] flex items-center justify-center shrink-0 mr-2 mt-1">
              <Sparkles className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
            </div>
            <div className="bg-[var(--surface-secondary)] rounded-[var(--radius-lg)] px-4 py-2.5 text-[13px] text-[var(--text-muted)]">
              Réflexion en cours...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] resize-none"
            rows={2}
            placeholder="Posez votre question... (Entrée pour envoyer)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="md"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
