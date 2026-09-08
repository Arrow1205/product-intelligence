'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, Plus, Trash2, GripVertical, Send, Copy, Check,
  AlignLeft, AlignJustify, ListChecks, Star, Hash, ToggleLeft, Info,
  Users, BarChart2, Settings2, Layers, Palette, Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Test, TestBlock, TestParticipant, TestResponse } from '@/lib/types/database'

interface Props {
  test: Test
  blocks: TestBlock[]
  participants: TestParticipant[]
  responses: TestResponse[]
  productId: string
  userId: string
}

const BLOCK_DEFS = [
  { type: 'instructions',  label: 'Instructions',     icon: Info,         defaultConfig: { text: '' } },
  { type: 'open_text',     label: 'Texte court',      icon: AlignLeft,    defaultConfig: { question: '', placeholder: '' } },
  { type: 'textarea',      label: 'Texte long',       icon: AlignJustify, defaultConfig: { question: '', placeholder: '' } },
  { type: 'single_choice', label: 'Choix unique',     icon: ToggleLeft,   defaultConfig: { question: '', options: ['Option A', 'Option B'] } },
  { type: 'multi_choice',  label: 'Cases à cocher',   icon: ListChecks,   defaultConfig: { question: '', options: ['Option A', 'Option B'] } },
  { type: 'rating_5',      label: 'Note sur 5 ★',    icon: Star,         defaultConfig: { question: '' } },
  { type: 'rating_10',     label: 'Échelle 1–10',     icon: Hash,         defaultConfig: { question: '' } },
]

const BLOCK_ICON: Record<string, React.ElementType> = Object.fromEntries(BLOCK_DEFS.map(d => [d.type, d.icon]))

const PRESET_COLORS = [
  '#ffffff', '#f8fafc', '#f0f4ff', '#fff7ed', '#f0fdf4',
  '#fdf4ff', '#fff1f2', '#0f172a', '#1e3a5f', '#064e3b',
]

const TABS = [
  { id: 'overview',    label: 'Infos',      icon: Settings2 },
  { id: 'appearance',  label: 'Apparence',  icon: Palette },
  { id: 'protocol',    label: 'Formulaire', icon: Layers },
  { id: 'publish',     label: 'Partager',   icon: Send },
  { id: 'results',     label: 'Résultats',  icon: BarChart2 },
  { id: 'participants', label: 'Participants', icon: Users },
]

const BUCKET = 'product-files'

export function TestDetail({ test: initialTest, blocks: initialBlocks, participants: initialParticipants, responses: initialResponses, productId, userId }: Props) {
  const router = useRouter()
  const [test, setTest] = useState(initialTest)
  const [blocks, setBlocks] = useState(initialBlocks)
  const [tab, setTab] = useState('overview')
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  // ── Block CRUD ─────────────────────────────────────────────────────────────

  const addBlock = async (def: typeof BLOCK_DEFS[number]) => {
    setSaving(true)
    const supabase = getSupabaseClient()
    const { data } = await supabase
      .from('test_blocks')
      .insert({ user_id: userId, product_id: test.product_id, test_id: test.id, block_type: def.type, position: blocks.length, config: def.defaultConfig as unknown as import('@/lib/types/database').Json })
      .select().single()
    setSaving(false)
    if (data) { setBlocks(prev => [...prev, data as TestBlock]); setEditingBlock(data.id) }
  }

  const updateBlockConfig = useCallback(async (blockId: string, config: Record<string, unknown>) => {
    setBlocks(prev => prev.map(b => b.id === blockId ? { ...b, config: config as unknown as import('@/lib/types/database').Json } : b))
    const supabase = getSupabaseClient()
    await supabase.from('test_blocks').update({ config: config as unknown as import('@/lib/types/database').Json }).eq('id', blockId)
  }, [])

  const deleteBlock = async (blockId: string) => {
    if (!confirm('Supprimer ce bloc ?')) return
    const supabase = getSupabaseClient()
    await supabase.from('test_blocks').delete().eq('id', blockId)
    const remaining = blocks.filter(b => b.id !== blockId)
    setBlocks(remaining)
    await Promise.all(remaining.map((b, i) => supabase.from('test_blocks').update({ position: i }).eq('id', b.id)))
    if (editingBlock === blockId) setEditingBlock(null)
  }

  const moveBlock = async (blockId: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === blockId)
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= blocks.length) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]]
    setBlocks(newBlocks)
    const supabase = getSupabaseClient()
    await Promise.all([
      supabase.from('test_blocks').update({ position: newIdx }).eq('id', newBlocks[newIdx].id),
      supabase.from('test_blocks').update({ position: idx }).eq('id', newBlocks[idx].id),
    ])
  }

  // ── Branding ───────────────────────────────────────────────────────────────

  const updateBranding = async (patch: { logo_url?: string | null; bg_color?: string | null }) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('tests').update(patch).eq('id', test.id).select().single()
    if (data) setTest(data as Test)
  }

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setUploadingLogo(true)
    const supabase = getSupabaseClient()
    const path = `${userId}/${test.product_id}/logo_${test.id}_${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: true })
    if (!error) {
      const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365)
      if (signed?.signedUrl) await updateBranding({ logo_url: path }) // store path, generate URL on demand
    }
    setUploadingLogo(false)
  }

  // ── Publish ────────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (blocks.length === 0) { alert('Ajoutez au moins un bloc avant de publier.'); return }
    setPublishing(true)
    const token = crypto.randomUUID().replace(/-/g, '')
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('tests').update({ status: 'published', public_token: token, published_at: new Date().toISOString() }).eq('id', test.id).select().single()
    setPublishing(false)
    if (data) { setTest(data as Test); setTab('publish') }
  }

  const handleUnpublish = async () => {
    if (!confirm('Dépublier ce test ?')) return
    const supabase = getSupabaseClient()
    const { data } = await supabase.from('tests').update({ status: 'draft', public_token: null, published_at: null }).eq('id', test.id).select().single()
    if (data) setTest(data as Test)
  }

  const publicUrl = typeof window !== 'undefined' && test.public_token
    ? `${window.location.origin}/test/${test.public_token}`
    : test.public_token ? `/test/${test.public_token}` : null

  const copyLink = () => {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const statusBadge = (
    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
      test.status === 'published' ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]')}>
      {test.status === 'published' ? 'Publié' : 'Brouillon'}
    </span>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-[var(--border-subtle)] px-6 py-4">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => router.push(`/products/${productId}/tests`)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)] flex-1 truncate">{test.title}</h1>
          {statusBadge}
          {test.status === 'draft' ? (
            <button onClick={handlePublish} disabled={publishing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
              <Send className="h-3.5 w-3.5" />{publishing ? 'Publication...' : 'Publier'}
            </button>
          ) : (
            <button onClick={handleUnpublish} className="px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--border-strong)] text-[var(--text-secondary)] text-xs font-medium hover:bg-[var(--surface-secondary)] transition-colors">
              Dépublier
            </button>
          )}
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] text-sm whitespace-nowrap transition-colors',
                tab === t.id ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]')}
            >
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">

        {/* ── INFOS ── */}
        {tab === 'overview' && (
          <div className="max-w-2xl space-y-4">
            {test.objective && <InfoRow label="Objectif" value={test.objective} />}
            {test.context && <InfoRow label="Contexte" value={test.context} />}
            {test.test_type && <InfoRow label="Type" value={test.test_type} />}
            {test.target_description && <InfoRow label="Cible" value={test.target_description} />}
            {test.estimated_minutes && <InfoRow label="Durée estimée" value={`${test.estimated_minutes} min`} />}
            <p className="text-xs text-[var(--text-muted)]">Créé le {new Date(test.created_at).toLocaleDateString('fr')}</p>
          </div>
        )}

        {/* ── APPARENCE ── */}
        {tab === 'appearance' && (
          <div className="max-w-xl space-y-8">
            {/* Logo */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">Logo</p>
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-subtle)] flex items-center justify-center overflow-hidden bg-[var(--surface-secondary)]"
                  style={{ backgroundColor: test.bg_color ?? '#ffffff' }}>
                  {test.logo_url ? (
                    <LogoPreview path={test.logo_url} userId={userId} />
                  ) : (
                    <Upload className="h-6 w-6 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="space-y-2">
                  <button onClick={() => logoRef.current?.click()} disabled={uploadingLogo}
                    className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] disabled:opacity-50 transition-colors">
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingLogo ? 'Envoi...' : 'Choisir un logo'}
                  </button>
                  {test.logo_url && (
                    <button onClick={() => updateBranding({ logo_url: null })} className="text-xs text-[var(--danger)] hover:underline block">
                      Supprimer le logo
                    </button>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">PNG, JPG ou SVG recommandé</p>
                </div>
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = '' }} />
            </div>

            {/* Background color */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Couleur de fond</p>
              <p className="text-xs text-[var(--text-muted)] mb-3">Le formulaire (questions) reste toujours sur fond blanc.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map(color => (
                  <button key={color} onClick={() => updateBranding({ bg_color: color })}
                    className={cn('w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                      test.bg_color === color ? 'border-[var(--accent-primary)] scale-110' : 'border-transparent')}
                    style={{ backgroundColor: color, boxShadow: color === '#ffffff' || color === '#f8fafc' ? 'inset 0 0 0 1px var(--border-subtle)' : undefined }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-[var(--text-muted)]">Couleur personnalisée :</label>
                <input type="color" value={test.bg_color ?? '#ffffff'} onChange={e => updateBranding({ bg_color: e.target.value })}
                  className="h-8 w-12 rounded cursor-pointer border border-[var(--border-subtle)]" />
                <span className="text-xs font-mono text-[var(--text-muted)]">{test.bg_color ?? '#ffffff'}</span>
              </div>
            </div>

            {/* Preview */}
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)] mb-2">Aperçu</p>
              <div className="rounded-[var(--radius-xl)] overflow-hidden border border-[var(--border-subtle)]" style={{ backgroundColor: test.bg_color ?? '#ffffff' }}>
                <div className="flex flex-col items-center py-8 px-6 text-center">
                  {test.logo_url && <LogoPreview path={test.logo_url} userId={userId} className="h-12 w-auto object-contain mb-4" />}
                  <h2 className="text-base font-bold mb-1" style={{ color: isLight(test.bg_color ?? '#ffffff') ? '#0f172a' : '#f8fafc' }}>{test.title}</h2>
                  <div className="mt-3 bg-white rounded-[var(--radius-lg)] p-4 w-full max-w-sm shadow-sm border border-gray-100">
                    <p className="text-xs text-gray-500 text-left">Question exemple</p>
                    <div className="h-8 bg-gray-100 rounded mt-2" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── FORMULAIRE ── */}
        {tab === 'protocol' && (
          <div className="max-w-2xl space-y-4">
            {blocks.length === 0 ? (
              <div className="flex flex-col items-center py-10 border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-xl)] text-center">
                <Layers className="h-8 w-8 text-[var(--text-muted)] mb-2" />
                <p className="text-sm text-[var(--text-muted)]">Ajoutez des blocs pour construire votre formulaire.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blocks.map((block, idx) => (
                  <BlockCard key={block.id} block={block} index={idx} total={blocks.length}
                    isEditing={editingBlock === block.id}
                    onEdit={() => setEditingBlock(editingBlock === block.id ? null : block.id)}
                    onDelete={() => deleteBlock(block.id)}
                    onMove={dir => moveBlock(block.id, dir)}
                    onConfigChange={cfg => updateBlockConfig(block.id, cfg)}
                  />
                ))}
              </div>
            )}
            <div className="pt-2">
              <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-2">Ajouter un bloc</p>
              <div className="flex flex-wrap gap-2">
                {BLOCK_DEFS.map(def => {
                  const Icon = def.icon
                  return (
                    <button key={def.type} onClick={() => addBlock(def)} disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors disabled:opacity-50">
                      <Icon className="h-3.5 w-3.5" />{def.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PARTAGER ── */}
        {tab === 'publish' && (
          <div className="max-w-xl space-y-6">
            {test.status !== 'published' ? (
              <div className="flex flex-col items-center py-10 text-center">
                <Send className="h-8 w-8 text-[var(--text-muted)] mb-3" />
                <p className="text-sm font-medium text-[var(--text-primary)] mb-4">Le test n&apos;est pas encore publié</p>
                <button onClick={handlePublish} disabled={publishing || blocks.length === 0} className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                  <Send className="h-4 w-4" />{publishing ? 'Publication...' : 'Publier le test'}
                </button>
                {blocks.length === 0 && <p className="text-xs text-[var(--text-muted)] mt-2">Ajoutez au moins un bloc avant de publier.</p>}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--success)]/10 border border-[var(--success)]/30">
                  <p className="text-sm font-semibold text-[var(--success)] mb-1">Test publié ✓</p>
                  <p className="text-xs text-[var(--text-secondary)]">Partagez ce lien. Les participants répondent sans se connecter.</p>
                </div>
                {publicUrl && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">Lien participant</p>
                    <div className="flex items-center gap-2 p-3 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)]">
                      <code className="flex-1 text-xs text-[var(--text-primary)] break-all">{publicUrl}</code>
                      <button onClick={copyLink} className="shrink-0 p-1.5 rounded-[var(--radius-sm)] hover:bg-[var(--surface-primary)] transition-colors">
                        {copied ? <Check className="h-4 w-4 text-[var(--success)]" /> : <Copy className="h-4 w-4 text-[var(--text-muted)]" />}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  {publicUrl && <a href={publicUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">Aperçu →</a>}
                  <button onClick={handleUnpublish} className="px-3 py-2 rounded-[var(--radius-md)] border border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] transition-colors">Dépublier</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── RÉSULTATS ── */}
        {tab === 'results' && <ResultsView blocks={blocks} responses={initialResponses} participants={initialParticipants} />}

        {/* ── PARTICIPANTS ── */}
        {tab === 'participants' && (
          <div className="max-w-2xl">
            {initialParticipants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun participant pour l&apos;instant.</p>
            ) : (
              <div className="space-y-2">
                {initialParticipants.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{p.name ?? 'Anonyme'}</p>
                      <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                        {p.email && <span>{p.email}</span>}
                        {(p as unknown as { job_title?: string }).job_title && <span>· {(p as unknown as { job_title: string }).job_title}</span>}
                        {(p as unknown as { age?: number }).age && <span>· {(p as unknown as { age: number }).age} ans</span>}
                      </div>
                    </div>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', p.completed_at ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]')}>
                      {p.completed_at ? 'Terminé' : 'En cours'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isLight(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

function LogoPreview({ path, userId, className }: { path: string; userId: string; className?: string }) {
  const [url, setUrl] = useState<string | null>(null)
  if (!url) {
    getSupabaseClient().storage.from('product-files').createSignedUrl(path, 3600).then(({ data }) => {
      if (data?.signedUrl) setUrl(data.signedUrl)
    })
  }
  if (!url) return <Upload className="h-5 w-5 text-[var(--text-muted)]" />
  return <img src={url} alt="Logo" className={className ?? 'h-full w-full object-contain'} />
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-[var(--text-primary)]">{value}</p>
    </div>
  )
}

// ─── BlockCard ────────────────────────────────────────────────────────────────

function BlockCard({ block, index, total, isEditing, onEdit, onDelete, onMove, onConfigChange }: {
  block: TestBlock; index: number; total: number; isEditing: boolean
  onEdit: () => void; onDelete: () => void; onMove: (d: -1 | 1) => void
  onConfigChange: (c: Record<string, unknown>) => void
}) {
  const Icon = BLOCK_ICON[block.block_type] ?? Info
  const cfg = (block.config ?? {}) as Record<string, unknown>
  const def = BLOCK_DEFS.find(d => d.type === block.block_type)

  return (
    <div className={cn('rounded-[var(--radius-lg)] border bg-[var(--surface-primary)] transition-colors', isEditing ? 'border-[var(--accent-primary)]' : 'border-[var(--border-subtle)]')}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[var(--border-subtle)]">
        <GripVertical className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
        <Icon className="h-3.5 w-3.5 text-[var(--accent-primary)] shrink-0" />
        <span className="text-xs font-medium text-[var(--text-primary)] flex-1">{def?.label ?? block.block_type}</span>
        <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] disabled:opacity-30 transition-colors text-xs">↑</button>
        <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] disabled:opacity-30 transition-colors text-xs">↓</button>
        <button onClick={onEdit} className="p-1 rounded hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] transition-colors text-xs">{isEditing ? '▲' : '▼'}</button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-[var(--danger)]/10 text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {!isEditing && (
        <button onClick={onEdit} className="w-full text-left px-3 py-2">
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1">
            {block.block_type === 'instructions' ? ((cfg.text as string) || '(Pas de texte)') : ((cfg.question as string) || '(Pas de question)')}
          </p>
        </button>
      )}
      {isEditing && <div className="px-3 py-3 space-y-3"><BlockEditor cfg={cfg} type={block.block_type} onChange={onConfigChange} /></div>}
    </div>
  )
}

// ─── BlockEditor ──────────────────────────────────────────────────────────────

function BlockEditor({ cfg, type, onChange }: { cfg: Record<string, unknown>; type: string; onChange: (c: Record<string, unknown>) => void }) {
  const set = (key: string, val: unknown) => onChange({ ...cfg, [key]: val })
  const inputCls = 'w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]'

  const questionInput = (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Question</label>
      <input className={inputCls} value={(cfg.question as string) ?? ''} onChange={e => set('question', e.target.value)} placeholder="Votre question..." />
    </div>
  )

  if (type === 'instructions') return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Texte d&apos;instruction</label>
      <textarea className={cn(inputCls, 'resize-none')} rows={3} value={(cfg.text as string) ?? ''} onChange={e => set('text', e.target.value)} placeholder="Texte affiché au participant..." />
    </div>
  )

  if (type === 'open_text' || type === 'textarea') return (
    <div className="space-y-2">
      {questionInput}
      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Placeholder</label>
        <input className={inputCls} value={(cfg.placeholder as string) ?? ''} onChange={e => set('placeholder', e.target.value)} placeholder="Texte d'aide..." />
      </div>
    </div>
  )

  if (type === 'rating_5' || type === 'rating_10') return questionInput

  if (type === 'single_choice' || type === 'multi_choice') {
    const options = (cfg.options as string[]) ?? ['']
    return (
      <div className="space-y-2">
        {questionInput}
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Options</label>
          <div className="space-y-1">
            {options.map((opt, i) => (
              <div key={i} className="flex gap-1">
                <input className={cn(inputCls, 'py-1.5')} value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; set('options', o) }} placeholder={`Option ${i + 1}`} />
                <button onClick={() => set('options', options.filter((_, j) => j !== i))} disabled={options.length <= 2} className="px-2 text-[var(--text-muted)] hover:text-[var(--danger)] disabled:opacity-30 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => set('options', [...options, ''])} className="mt-1 flex items-center gap-1 text-xs text-[var(--accent-primary)] hover:underline">
            <Plus className="h-3 w-3" /> Ajouter une option
          </button>
        </div>
      </div>
    )
  }

  return <p className="text-xs text-[var(--text-muted)]">Type : {type}</p>
}

// ─── ResultsView ──────────────────────────────────────────────────────────────

function ResultsView({ blocks, responses, participants }: { blocks: TestBlock[]; responses: TestResponse[]; participants: TestParticipant[] }) {
  if (participants.length === 0) return (
    <div className="flex flex-col items-center py-16 text-center">
      <BarChart2 className="h-10 w-10 text-[var(--text-muted)] mb-3" />
      <p className="text-sm text-[var(--text-muted)]">Aucune réponse pour l&apos;instant. Partagez le lien du test.</p>
    </div>
  )

  return (
    <div className="max-w-2xl space-y-6">
      <p className="text-sm text-[var(--text-muted)]">{participants.length} participant{participants.length > 1 ? 's' : ''} · {responses.length} réponse{responses.length > 1 ? 's' : ''}</p>
      {blocks.map(block => {
        const cfg = (block.config ?? {}) as Record<string, unknown>
        const blockResponses = responses.filter(r => r.block_id === block.id)
        const question = (cfg.question as string) || (cfg.text as string) || block.block_type
        return (
          <div key={block.id} className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)]">
            <p className="text-sm font-semibold text-[var(--text-primary)] mb-3">{question}</p>
            {(block.block_type === 'rating_5' || block.block_type === 'rating_10') && <RatingResults responses={blockResponses} max={block.block_type === 'rating_5' ? 5 : 10} />}
            {(block.block_type === 'single_choice' || block.block_type === 'multi_choice') && <ChoiceResults responses={blockResponses} options={(cfg.options as string[]) ?? []} />}
            {(block.block_type === 'open_text' || block.block_type === 'textarea') && (
              <div className="space-y-2">{blockResponses.map(r => {
                const ans = r.answer as Record<string, unknown>
                return <p key={r.id} className="text-sm text-[var(--text-primary)] p-2 bg-[var(--surface-secondary)] rounded-[var(--radius-md)]">{String(ans.value ?? '')}</p>
              })}</div>
            )}
            {block.block_type === 'instructions' && <p className="text-xs text-[var(--text-muted)]">Bloc d&apos;instructions — pas de réponse</p>}
          </div>
        )
      })}
    </div>
  )
}

function RatingResults({ responses, max }: { responses: TestResponse[]; max: number }) {
  const vals = responses.map(r => Number((r.answer as Record<string, unknown>).value ?? 0)).filter(v => v > 0)
  if (vals.length === 0) return <p className="text-xs text-[var(--text-muted)]">Aucune réponse</p>
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-[var(--text-primary)]">Moyenne : {avg.toFixed(1)} / {max}</p>
      <div className="space-y-1">
        {Array.from({ length: max }, (_, i) => i + 1).map(v => {
          const n = vals.filter(x => x === v).length
          return (
            <div key={v} className="flex items-center gap-2">
              <span className="text-xs w-4 text-right text-[var(--text-muted)]">{v}</span>
              <div className="flex-1 h-3 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
                <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${(n / vals.length) * 100}%` }} />
              </div>
              <span className="text-xs text-[var(--text-muted)] w-4">{n}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ChoiceResults({ responses, options }: { responses: TestResponse[]; options: string[] }) {
  if (responses.length === 0) return <p className="text-xs text-[var(--text-muted)]">Aucune réponse</p>
  const counts: Record<string, number> = {}
  options.forEach(o => { counts[o] = 0 })
  responses.forEach(r => {
    const val = (r.answer as Record<string, unknown>).value
    if (Array.isArray(val)) val.forEach(v => { if (typeof v === 'string') counts[v] = (counts[v] ?? 0) + 1 })
    else if (typeof val === 'string') counts[val] = (counts[val] ?? 0) + 1
  })
  return (
    <div className="space-y-1">
      {options.map(opt => (
        <div key={opt} className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)] w-32 truncate">{opt}</span>
          <div className="flex-1 h-3 rounded-full bg-[var(--surface-secondary)] overflow-hidden">
            <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${((counts[opt] ?? 0) / responses.length) * 100}%` }} />
          </div>
          <span className="text-xs text-[var(--text-muted)] w-4">{counts[opt] ?? 0}</span>
        </div>
      ))}
    </div>
  )
}
