'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, Trash2, Download, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Asset } from '@/lib/types/database'

interface Props { assets: Asset[]; productId: string; userId: string }

const BUCKET = 'product-files'
const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.csv,.md,.docx,.xlsx,.xls,.doc,.ppt,.pptx,.pptm'
const MAX_MB = 50

// Fallback MIME types for extensions where file.type can be empty (common on macOS/Windows for Office files)
const MIME_FALLBACK: Record<string, string> = {
  pdf:  'application/pdf',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls:  'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  pptm: 'application/vnd.ms-powerpoint.presentation.macroEnabled.12',
  txt:  'text/plain',
  csv:  'text/csv',
  md:   'text/markdown',
  svg:  'image/svg+xml',
}

function resolveContentType(file: File): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_FALLBACK[ext] ?? 'application/octet-stream'
}

function fileIcon(mime: string | null) {
  if (!mime) return File
  if (mime.startsWith('image/')) return Image
  return FileText
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export function FilesView({ assets: initial, productId, userId }: Props) {
  const [assets, setAssets] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Direct upload to Supabase Storage from browser — bypasses Next.js body limit
  const uploadFile = useCallback(async (file: File) => {
    if (file.size > MAX_MB * 1024 * 1024) {
      setUploadError(`Fichier trop volumineux (max ${MAX_MB} Mo)`)
      return
    }

    setUploading(true)
    setUploadError(null)
    setProgress(`Envoi de ${file.name}...`)

    const supabase = getSupabaseClient()
    const storagePath = `${userId}/${productId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`

    const contentType = resolveContentType(file)

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, {
      contentType,
      upsert: false,
    })

    if (uploadError) {
      const msg = uploadError.message
      const friendly = msg.includes('Bucket') || msg.includes('bucket')
        ? 'Bucket Storage introuvable. Créez le bucket "product-files" dans Supabase.'
        : msg.includes('not allowed') || msg.includes('mime') || msg.includes('type')
          ? `Type de fichier refusé par le bucket (${contentType}). Vérifiez les allowed MIME types dans Supabase Storage.`
          : msg.includes('size') || msg.includes('limit')
            ? `Fichier trop volumineux pour le bucket Supabase. Vérifiez la limite configurée.`
            : msg || 'Erreur lors de l\'envoi'
      setUploadError(friendly)
      setUploading(false)
      setProgress(null)
      return
    }

    setProgress('Enregistrement des métadonnées...')

    // Save metadata to DB
    const ext = file.name.split('.').pop() ?? ''
    const aiReadable = ['application/pdf', 'text/plain', 'text/csv', 'text/markdown'].includes(file.type)
    const { data: asset, error: dbError } = await supabase.from('assets').insert({
      user_id: userId,
      product_id: productId,
      original_name: file.name,
      storage_path: storagePath,
      mime_type: file.type,
      extension: ext,
      size_bytes: file.size,
      processing_status: 'uploaded',
      ai_readable: aiReadable,
    }).select().single()

    setUploading(false)
    setProgress(null)

    if (dbError) { setUploadError(dbError.message); return }
    if (asset) setAssets(prev => [asset as Asset, ...prev])
  }, [productId, userId])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadFile(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (assetId: string, storagePath: string) => {
    if (!confirm('Supprimer ce fichier ?')) return
    setDeletingId(assetId)
    const supabase = getSupabaseClient()
    await supabase.storage.from(BUCKET).remove([storagePath])
    await supabase.from('assets').delete().eq('id', assetId)
    setAssets(prev => prev.filter(a => a.id !== assetId))
    setDeletingId(null)
  }

  const handleDownload = async (asset: Asset) => {
    const supabase = getSupabaseClient()
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(asset.storage_path, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Documents</h1>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[var(--radius-xl)] p-8 text-center transition-colors',
          uploading ? 'opacity-60 cursor-wait' : 'cursor-pointer',
          dragOver ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-secondary)]',
        )}
      >
        <Upload className={cn('h-8 w-8 mx-auto mb-2 transition-colors', dragOver ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]')} />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {progress ?? 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">PDF, images, Word, Excel, texte — max 50 Mo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
        />
      </div>

      {uploadError && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* File list */}
      {assets.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <File className="h-10 w-10 text-[var(--text-muted)] mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucun document. Importez vos fichiers ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {assets.map(asset => {
            const Icon = fileIcon(asset.mime_type)
            return (
              <div key={asset.id} className="group flex items-center gap-3 p-3 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)]/50 transition-colors">
                <Icon className="h-5 w-5 text-[var(--accent-primary)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{asset.original_name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {formatSize(asset.size_bytes)}
                    {asset.extension && ` · ${asset.extension.toUpperCase()}`}
                    {' · '}{new Date(asset.created_at).toLocaleDateString('fr')}
                    {asset.ai_readable && <span className="ml-2 text-[var(--accent-primary)]">IA ✓</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownload(asset)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors" title="Télécharger">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(asset.id, asset.storage_path)} disabled={deletingId === asset.id} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50 transition-colors" title="Supprimer">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
