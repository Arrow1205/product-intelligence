'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, BarChart2, Database, Users, UserCircle, AlertTriangle,
  FileText, Lightbulb, TrendingUp, Map, GitBranch, FlaskConical,
  BarChart3, Sparkles, Settings, ChevronLeft, ChevronRight, FolderOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Tooltip } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  phase?: number
  soon?: boolean
}

const primaryNav: NavItem[] = [
  { label: 'Dashboard',        href: '',                icon: LayoutDashboard, phase: 1 },
  { label: 'Analytics',        href: '/analytics',      icon: BarChart2,       phase: 1 },
  { label: 'Data Sources',     href: '/data-sources',   icon: Database,        phase: 1 },
]

const intelligenceNav: NavItem[] = [
  { label: 'Research',         href: '/research',       icon: FileText,        phase: 2, soon: true },
  { label: 'Personas',         href: '/personas',       icon: UserCircle,      phase: 3, soon: true },
  { label: 'Cohorts',          href: '/cohorts',        icon: Users,           phase: 3, soon: true },
  { label: 'Pain Points',      href: '/pain-points',    icon: AlertTriangle,   phase: 4, soon: true },
  { label: 'Insights',         href: '/insights',       icon: Lightbulb,       phase: 4, soon: true },
  { label: 'CRO',              href: '/cro',            icon: TrendingUp,      phase: 4, soon: true },
]

const growthNav: NavItem[] = [
  { label: 'Growth Backlog',   href: '/growth-backlog', icon: BarChart3,       phase: 5, soon: true },
  { label: 'Roadmap',          href: '/roadmap',        icon: Map,             phase: 5, soon: true },
  { label: 'Opportunity Tree', href: '/opportunity-tree', icon: GitBranch,     phase: 5, soon: true },
  { label: 'Experiments',      href: '/experiments',    icon: FlaskConical,    phase: 6, soon: true },
  { label: 'Benchmark',        href: '/benchmark',      icon: BarChart2,       phase: 7, soon: true },
]

interface SidebarProps {
  projectId: string
  projectName: string
}

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const base = `/project/${projectId}`

  const isActive = (href: string) => {
    const full = `${base}${href}`
    if (href === '') return pathname === base || pathname === `${base}/`
    return pathname.startsWith(full)
  }

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-primary)]',
        'transition-[width] duration-200 ease-in-out shrink-0',
        collapsed ? 'w-[56px]' : 'w-[220px]',
      )}
    >
      {/* Project header */}
      <div className={cn(
        'flex items-center gap-2.5 px-3 py-3.5 border-b border-[var(--border-subtle)]',
        collapsed && 'justify-center px-2',
      )}>
        <Link
          href="/"
          className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white shrink-0 hover:opacity-90 transition-opacity"
          title="All projects"
        >
          <FolderOpen className="h-3.5 w-3.5" />
        </Link>
        {!collapsed && (
          <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight">
            {projectName}
          </span>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" aria-label="Project navigation">
        <NavGroup items={primaryNav} base={base} collapsed={collapsed} isActive={isActive} />
        <Divider />
        <NavGroup items={intelligenceNav} base={base} collapsed={collapsed} isActive={isActive} />
        <Divider />
        <NavGroup items={growthNav} base={base} collapsed={collapsed} isActive={isActive} />
        <Divider />
        <NavItem
          item={{ label: 'Ask AI', href: '/ask', icon: Sparkles }}
          base={base}
          collapsed={collapsed}
          active={isActive('/ask')}
          soon
        />
      </nav>

      {/* Bottom: theme + settings + collapse */}
      <div className={cn(
        'border-t border-[var(--border-subtle)] px-2 py-2 space-y-0.5',
      )}>
        <ThemeToggle collapsed={collapsed} />
        <NavItem
          item={{ label: 'Settings', href: '/settings', icon: Settings }}
          base={base}
          collapsed={collapsed}
          active={isActive('/settings')}
        />
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'absolute -right-3 top-[54px] z-10',
          'flex h-6 w-6 items-center justify-center',
          'rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)]',
          'text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors',
          'shadow-[var(--shadow-sm)]',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>
    </aside>
  )
}

function Divider() {
  return <div className="my-1 h-px bg-[var(--border-subtle)]" />
}

function NavGroup({
  items, base, collapsed, isActive,
}: {
  items: NavItem[]
  base: string
  collapsed: boolean
  isActive: (href: string) => boolean
}) {
  return (
    <>
      {items.map((item) => (
        <NavItem
          key={item.href}
          item={item}
          base={base}
          collapsed={collapsed}
          active={isActive(item.href)}
          soon={item.soon}
        />
      ))}
    </>
  )
}

function NavItem({
  item, base, collapsed, active, soon,
}: {
  item: NavItem
  base: string
  collapsed: boolean
  active: boolean
  soon?: boolean
}) {
  const Icon = item.icon
  const href = soon ? '#' : `${base}${item.href}`

  const content = (
    <Link
      href={href}
      onClick={soon ? (e) => e.preventDefault() : undefined}
      className={cn(
        'flex items-center gap-2.5 rounded-[var(--radius-md)] transition-colors',
        collapsed ? 'h-8 w-8 justify-center' : 'h-8 px-2',
        active
          ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
          : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]',
        soon && 'opacity-40 pointer-events-none',
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <span className="text-[13px] font-medium truncate">{item.label}</span>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip content={item.label} side="right">
        {content}
      </Tooltip>
    )
  }

  return content
}
