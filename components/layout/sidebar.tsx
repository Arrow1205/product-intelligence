'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, BarChart2, Database, Users, UserCircle, AlertTriangle,
  FileText, Lightbulb, TrendingUp, Map, GitBranch, FlaskConical,
  BarChart3, Sparkles, Settings, ChevronLeft, ChevronRight, FolderOpen, ChevronDown, Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Tooltip } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Project } from '@/lib/types/database'

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
  { label: 'Personas',         href: '/personas',       icon: UserCircle,      phase: 3 },
  { label: 'Cohorts',          href: '/cohorts',        icon: Users,           phase: 3, soon: true },
  { label: 'Pain Points',      href: '/pain-points',    icon: AlertTriangle,   phase: 4 },
  { label: 'Insights',         href: '/insights',       icon: Lightbulb,       phase: 4 },
  { label: 'CRO',              href: '/cro',            icon: TrendingUp,      phase: 4, soon: true },
]

const growthNav: NavItem[] = [
  { label: 'Growth Backlog',   href: '/growth-backlog', icon: BarChart3,       phase: 5 },
  { label: 'Roadmap',          href: '/roadmap',        icon: Map,             phase: 5 },
  { label: 'Opportunity Tree', href: '/opportunity-tree', icon: GitBranch,     phase: 5, soon: true },
  { label: 'Experiments',      href: '/experiments',    icon: FlaskConical,    phase: 6 },
  { label: 'Benchmark',        href: '/benchmark',      icon: BarChart2,       phase: 7 },
]

interface SidebarProps {
  projectId: string
  projectName: string
}

export function Sidebar({ projectId, projectName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const base = `/project/${projectId}`

  const isActive = (href: string) => {
    const full = `${base}${href}`
    if (href === '') return pathname === base || pathname === `${base}/`
    return pathname.startsWith(full)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSwitcherToggle = async () => {
    if (!switcherOpen && projects.length === 0) {
      setLoadingProjects(true)
      const supabase = getSupabaseClient()
      const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
      setProjects(data ?? [])
      setLoadingProjects(false)
    }
    setSwitcherOpen(v => !v)
  }

  const switcherButton = (
    <button
      onClick={handleSwitcherToggle}
      className={cn(
        'flex items-center gap-2 w-full transition-colors',
        collapsed ? 'justify-center' : 'px-1',
      )}
    >
      <span className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-md)] bg-[var(--accent-primary)] text-white shrink-0">
        <FolderOpen className="h-3.5 w-3.5" />
      </span>
      {!collapsed && (
        <>
          <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate leading-tight flex-1 text-left">
            {projectName}
          </span>
          <ChevronDown className={cn('h-3.5 w-3.5 text-[var(--text-muted)] shrink-0 transition-transform', switcherOpen && 'rotate-180')} />
        </>
      )}
    </button>
  )

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-[var(--border-subtle)] bg-[var(--surface-primary)]',
        'transition-[width] duration-200 ease-in-out shrink-0',
        collapsed ? 'w-[56px]' : 'w-[220px]',
      )}
    >
      {/* Project switcher header */}
      <div
        ref={switcherRef}
        className={cn(
          'relative border-b border-[var(--border-subtle)]',
          collapsed ? 'px-2 py-3.5 flex justify-center' : 'px-3 py-3.5',
        )}
      >
        {collapsed ? (
          <Tooltip content="Changer de projet" side="right">
            {switcherButton}
          </Tooltip>
        ) : switcherButton}

        {switcherOpen && !collapsed && (
          <div className={cn(
            'absolute left-0 right-0 top-full z-50 mt-0.5 mx-2',
            'rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-[var(--shadow-md)]',
            'overflow-hidden',
          )}>
            {loadingProjects ? (
              <p className="px-3 py-3 text-[12px] text-[var(--text-muted)]">Chargement...</p>
            ) : (
              <>
                {projects.filter(p => p.id !== projectId).map(p => (
                  <Link
                    key={p.id}
                    href={`/project/${p.id}`}
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
                {projects.filter(p => p.id !== projectId).length === 0 && (
                  <p className="px-3 py-2 text-[12px] text-[var(--text-muted)]">Aucun autre projet</p>
                )}
                <div className="border-t border-[var(--border-subtle)]">
                  <Link
                    href="/"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--accent-primary)] hover:bg-[var(--surface-secondary)] transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Nouveau projet</span>
                  </Link>
                </div>
              </>
            )}
          </div>
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
