'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Brain, FileText, FlaskConical, AlertTriangle, Lightbulb, Activity } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { Product, AiRecommendation } from '@/lib/types/database'

interface ActivityLogItem {
  id: string
  action: string
  entity_type: string | null
  created_at: string
}

interface Props {
  product: Product
  needsCount: number
  testsCount: number
  painPointsCount: number
  insightsCount: number
  recommendations: AiRecommendation[]
  activities: ActivityLogItem[]
}

export function OverviewView({ product, needsCount, testsCount, painPointsCount, insightsCount, recommendations, activities }: Props) {
  const { productId } = useParams<{ productId: string }>()
  const base = `/products/${productId}`

  const stats = [
    { label: 'Expressions de besoin', value: needsCount, icon: FileText, href: `${base}/needs` },
    { label: 'Tests', value: testsCount, icon: FlaskConical, href: `${base}/tests` },
    { label: 'Pain Points', value: painPointsCount, icon: AlertTriangle, href: `${base}/pain-points` },
    { label: 'Insights', value: insightsCount, icon: Lightbulb, href: `${base}/insights` },
  ]

  const stageBadge = product.stage ? (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent-primary)]">
      {product.stage}
    </span>
  ) : null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{product.name}</h1>
            {stageBadge}
          </div>
          {product.short_description && (
            <p className="text-[var(--text-secondary)] text-sm">{product.short_description}</p>
          )}
        </div>
        <Link
          href={`${base}/ai`}
          className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Brain className="h-4 w-4" />
          Analyse IA
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link
            key={stat.label}
            href={stat.href}
            className="flex flex-col gap-2 p-4 rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] hover:border-[var(--accent-primary)] transition-colors"
          >
            <stat.icon className="h-5 w-5 text-[var(--text-muted)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Top recommandations IA</h2>
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="flex items-start gap-2">
                  <span className={cn(
                    'mt-0.5 h-2 w-2 rounded-full shrink-0',
                    rec.priority === 'high' ? 'bg-[var(--danger)]' : rec.priority === 'medium' ? 'bg-[var(--warning)]' : 'bg-[var(--success)]',
                  )} />
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">{rec.title}</p>
                    {rec.rationale && <p className="text-xs text-[var(--text-muted)] line-clamp-2">{rec.rationale}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity */}
        {activities.length > 0 && (
          <div className="rounded-[var(--radius-lg)] bg-[var(--surface-primary)] border border-[var(--border-subtle)] p-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--text-muted)]" />
              Activite recente
            </h2>
            <div className="space-y-2">
              {activities.map(a => (
                <div key={a.id} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="text-[var(--text-muted)]">{new Date(a.created_at).toLocaleDateString('fr')}</span>
                  <span>{a.action}</span>
                  {a.entity_type && <span className="text-[var(--text-muted)]">({a.entity_type})</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
