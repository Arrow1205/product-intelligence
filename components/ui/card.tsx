import { cn } from '@/lib/utils/cn'

interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function Card({ children, className, hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-primary)]',
        hover && 'transition-shadow hover:shadow-[var(--shadow-md)] cursor-pointer',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 pt-4 pb-3 border-b border-[var(--border-subtle)]', className)}>
      {children}
    </div>
  )
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('px-5 py-3 border-t border-[var(--border-subtle)]', className)}>
      {children}
    </div>
  )
}

/* Stat card for KPI/metric display */
interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  trend?: { value: number; direction: 'up' | 'down' | 'neutral' }
  description?: string
  className?: string
}

export function StatCard({ label, value, unit, trend, description, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <p className="text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
      <div className="mt-1.5 flex items-end gap-1.5">
        <span className="text-[28px] font-bold tracking-tight text-[var(--text-primary)] leading-none">{value}</span>
        {unit && <span className="text-[14px] text-[var(--text-muted)] pb-0.5">{unit}</span>}
      </div>
      {trend && (
        <p className={cn(
          'mt-1.5 text-[12px] font-medium',
          trend.direction === 'up' ? 'text-[var(--success)]' : trend.direction === 'down' ? 'text-[var(--danger)]' : 'text-[var(--text-muted)]',
        )}>
          {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '–'} {Math.abs(trend.value)}%
        </p>
      )}
      {description && <p className="mt-1 text-[12px] text-[var(--text-muted)]">{description}</p>}
    </Card>
  )
}
