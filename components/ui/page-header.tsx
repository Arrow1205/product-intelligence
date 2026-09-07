import { cn } from '@/lib/utils/cn'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  breadcrumb?: Array<{ label: string; href?: string }>
  className?: string
}

export function PageHeader({ title, description, action, breadcrumb, className }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 mb-6', className)}>
      <div className="min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="flex items-center gap-1 mb-1" aria-label="Breadcrumb">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-[var(--text-muted)] text-[11px]">/</span>}
                {item.href ? (
                  <a href={item.href} className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-[11px] text-[var(--text-muted)]">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] truncate">
          {title}
        </h1>
        {description && (
          <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* Section header — lower level than PageHeader */
export function SectionHeader({ title, action, className }: { title: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)}>
      <h2 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">{title}</h2>
      {action && <div>{action}</div>}
    </div>
  )
}
