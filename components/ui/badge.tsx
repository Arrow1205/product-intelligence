import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
  default:  'bg-[var(--surface-secondary)] text-[var(--text-secondary)]',
  success:  'bg-[var(--success-muted)] text-[var(--success)]',
  warning:  'bg-[var(--warning-muted)] text-[var(--warning)]',
  danger:   'bg-[var(--danger-muted)] text-[var(--danger)]',
  info:     'bg-[var(--info-muted)] text-[var(--info)]',
  muted:    'bg-[var(--surface-secondary)] text-[var(--text-muted)]',
  accent:   'bg-[var(--accent-muted)] text-[var(--accent-primary)]',
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-[var(--radius-sm)]',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-[12px]',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* Evidence type tag — OBSERVED / INFERRED / GENERATED / VALIDATED */
type EvidenceType = 'observed' | 'inferred' | 'generated' | 'validated'

const evidenceConfig: Record<EvidenceType, { label: string; color: string; dot: string }> = {
  observed:  { label: 'Observed',  color: 'text-[var(--evidence-observed)]',  dot: 'bg-[var(--evidence-observed)]' },
  inferred:  { label: 'Inferred',  color: 'text-[var(--evidence-inferred)]',  dot: 'bg-[var(--evidence-inferred)]' },
  generated: { label: 'Generated', color: 'text-[var(--evidence-generated)]', dot: 'bg-[var(--evidence-generated)]' },
  validated: { label: 'Validated', color: 'text-[var(--evidence-validated)]', dot: 'bg-[var(--evidence-validated)]' },
}

export function EvidenceTag({ type }: { type: EvidenceType }) {
  const cfg = evidenceConfig[type]
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide', cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

/* Persona status tag */
type PersonaStatus = 'generated' | 'hybrid' | 'data-backed'

const personaConfig: Record<PersonaStatus, { label: string; color: string }> = {
  generated:    { label: 'Generated',   color: 'bg-[var(--warning-muted)] text-[var(--warning)]' },
  hybrid:       { label: 'Hybrid',      color: 'bg-[var(--info-muted)] text-[var(--info)]' },
  'data-backed': { label: 'Data-backed', color: 'bg-[var(--success-muted)] text-[var(--success)]' },
}

export function PersonaStatusBadge({ status }: { status: PersonaStatus }) {
  const cfg = personaConfig[status]
  return (
    <span className={cn('inline-flex items-center px-1.5 py-0.5 text-[11px] font-medium rounded-[var(--radius-sm)]', cfg.color)}>
      {cfg.label}
    </span>
  )
}
