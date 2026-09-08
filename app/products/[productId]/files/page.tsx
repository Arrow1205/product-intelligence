export const metadata = { title: 'Documents' }
export default function FilesPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Documents</h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">Document workspace — bientôt disponible</p>
      <div className="flex flex-col items-center justify-center py-24 border border-dashed border-[var(--border-subtle)] rounded-[var(--radius-xl)]">
        <svg className="h-12 w-12 text-[var(--text-muted)] mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Workspace documents</p>
        <p className="text-sm text-[var(--text-muted)]">Upload et analyse de fichiers — disponible prochainement</p>
      </div>
    </div>
  )
}
