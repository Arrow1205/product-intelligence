'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Globe, Clock, ArrowRight, FolderOpen } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { Project } from '@/lib/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/empty-state'
import { CreateProjectDialog } from './create-project-dialog'
import { ThemeToggle } from '@/components/layout/theme-toggle'
import { cn } from '@/lib/utils/cn'

interface Props {
  initialProjects: Project[]
  error?: string
}

export function ProjectList({ initialProjects, error }: Props) {
  const [projects, setProjects] = useState<Project[]>(initialProjects)
  const [createOpen, setCreateOpen] = useState(false)
  const router = useRouter()

  if (error) return <ErrorState message={error} />

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white">
            <FolderOpen className="h-4 w-4" />
          </div>
          <span className="text-[15px] font-semibold text-[var(--text-primary)]">Product Intelligence</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)]">Projets</h1>
        <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">
          {projects.length === 0
            ? 'Créez votre premier projet pour commencer.'
            : `${projects.length} projet${projects.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Project grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="Aucun projet"
          description="Créez un projet pour commencer à centraliser vos données produit, vos recherches et vos initiatives de croissance."
          action={{ label: 'Créer mon premier projet', onClick: () => setCreateOpen(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => router.push(`/project/${project.id}`)}
            />
          ))}
          <button
            onClick={() => setCreateOpen(true)}
            className="flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border-subtle)] py-8 text-[var(--text-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-secondary)] cursor-pointer"
          >
            <Plus className="h-5 w-5" />
            <span className="text-[13px] font-medium">Nouveau projet</span>
          </button>
        </div>
      )}

      <CreateProjectDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(project) => {
          setProjects((prev) => [project, ...prev])
          router.push(`/project/${project.id}`)
        }}
      />
    </>
  )
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group text-left rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5',
        'transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-md)]',
        'focus-visible:outline-2 focus-visible:outline-[var(--accent-primary)]',
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[14px] font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--accent-primary)] transition-colors">
            {project.name}
          </h2>
          {project.url && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--text-muted)] truncate">
              <Globe className="h-3 w-3 shrink-0" />
              {project.url.replace(/^https?:\/\//, '')}
            </p>
          )}
        </div>
        <Badge
          variant={project.status === 'active' ? 'success' : 'muted'}
          className="shrink-0"
        >
          {project.status}
        </Badge>
      </div>

      {project.description && (
        <p className="text-[12px] text-[var(--text-muted)] line-clamp-2 mb-3">
          {project.description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)] group-hover:text-[var(--accent-primary)] transition-colors" />
      </div>
    </button>
  )
}
