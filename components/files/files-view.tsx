'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Image, Trash2, Download, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Asset } from '@/lib/types/database'

interface Props { assets: Asset[]; productId: string; userId: string }

const ACCEPTED = '.pdf,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.csv,.md,.docx,.xlsx,.xls,.doc'

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

export function FilesView({ assets: initial, productId }: Props) {
  const [assets, setAssets] = useState(initial)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('productId', productId)
      const res = await fetch('/api/assets/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setUploadError(json.error ?? 'Erreur d\'upload'); return }
      setAssets(prev => [json.asset as Asset, ...prev])
    } catch {
      setUploadError('Erreur réseau')
    } finally {
      setUploading(false)
    }
  }, [productId])

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(f => uploadFile(f))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (assetId: string) => {
    if (!confirm('Supprimer ce fichier ?')) return
    setDeletingId(assetId)
    await fetch(`/api/assets/${assetId}`, { method: 'DELETE' })
    setAssets(prev => prev.filter(a => a.id !== assetId))
    setDeletingId(null)
  }

  const handleDownload = async (asset: Asset) => {
    const res = await fetch(`/api/assets/${asset.id}`)
    const json = await res.json()
    if (json.url) window.open(json.url, '_blank')
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-xl font-bold text-[var(--text-primary)]">Documents</h1>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-[var(--radius-xl)] p-8 text-center cursor-pointer transition-colors',
          dragOver ? 'border-[var(--accent-primary)] bg-[var(--accent-muted)]' : 'border-[var(--border-subtle)] hover:border-[var(--accent-primary)] hover:bg-[var(--surface-secondary)]',
        )}
      >
        <Upload className={cn('h-8 w-8 mx-auto mb-2 transition-colors', dragOver ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]')} />
        <p className="text-sm font-medium text-[var(--text-primary)]">
          {uploading ? 'Envoi en cours...' : 'Glissez vos fichiers ici ou cliquez pour sélectionner'}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-1">PDF, images, Word, Excel, texte — max 50 Mo</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>

      {uploadError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--danger)]/10 text-[var(--danger)] text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {uploadError}
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
                    {asset.mime_type && ` · ${asset.extension?.toUpperCase()}`}
                    {' · '}{new Date(asset.created_at).toLocaleDateString('fr')}
                    {asset.ai_readable && <span className="ml-2 text-[var(--accent-primary)]">IA ✓</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleDownload(asset)} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors" title="Télécharger">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => handleDelete(asset.id)} disabled={deletingId === asset.id} className="p-1.5 rounded-[var(--radius-sm)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--danger)]/10 disabled:opacity-50 transition-colors" title="Supprimer">
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
