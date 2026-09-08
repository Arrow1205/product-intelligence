'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import {
  LayoutDashboard, FileText, FolderOpen, FlaskConical, AlertTriangle,
  Lightbulb, Sparkles, Settings, ChevronLeft, ChevronRight, ChevronDown, Plus, LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Tooltip } from '@/components/ui/tooltip'
import { ThemeToggle } from './theme-toggle'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/database'

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
}

const navItems: NavItem[] = [
  { label: 'Overview',          href: '/overview',     icon: LayoutDashboard },
  { label: 'Expression besoin', href: '/needs',        icon: FileText },
  { label: 'Documents',         href: '/files',        icon: FolderOpen },
  { label: 'Tests',             href: '/tests',        icon: FlaskConical },
  { label: 'Pain Points',       href: '/pain-points',  icon: AlertTriangle },
  { label: 'Insights',          href: '/insights',     icon: Lightbulb },
  { label: 'AI Analysis',       href: '/ai',           icon: Sparkles },
]

interface SidebarProps {
  productId: string
  productName: string
}

export function Sidebar({ productId, productName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const switcherRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  const base = `/products/${productId}`

  const isActive = (href: string) => {
    const full = `${base}${href}`
    return pathname === full || pathname.startsWith(`${full}/`)
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
    if (!switcherOpen && products.length === 0) {
      setLoadingProducts(true)
      const supabase = getSupabaseClient()
      const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      setProducts((data as Product[]) ?? [])
      setLoadingProducts(false)
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
            {productName}
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
      <div
        ref={switcherRef}
        className={cn(
          'relative border-b border-[var(--border-subtle)]',
          collapsed ? 'px-2 py-3.5 flex justify-center' : 'px-3 py-3.5',
        )}
      >
        {collapsed ? (
          <Tooltip content="Changer de produit" side="right">
            {switcherButton}
          </Tooltip>
        ) : switcherButton}

        {switcherOpen && !collapsed && (
          <div className={cn(
            'absolute left-0 right-0 top-full z-50 mt-0.5 mx-2',
            'rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-[var(--shadow-md)]',
            'overflow-hidden',
          )}>
            {loadingProducts ? (
              <p className="px-3 py-3 text-[12px] text-[var(--text-muted)]">Chargement...</p>
            ) : (
              <>
                {products.filter(p => p.id !== productId).map(p => (
                  <Link
                    key={p.id}
                    href={`/products/${p.id}/overview`}
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] transition-colors"
                  >
                    <FolderOpen className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </Link>
                ))}
                {products.filter(p => p.id !== productId).length === 0 && (
                  <p className="px-3 py-2 text-[12px] text-[var(--text-muted)]">Aucun autre produit</p>
                )}
                <div className="border-t border-[var(--border-subtle)]">
                  <Link
                    href="/products"
                    onClick={() => setSwitcherOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-[13px] text-[var(--accent-primary)] hover:bg-[var(--surface-secondary)] transition-colors font-medium"
                  >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    <span>Nouveau produit</span>
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5" aria-label="Product navigation">
        {navItems.map((item) => {
          const active = isActive(item.href)
          const Icon = item.icon
          const content = (
            <Link
              href={`${base}${item.href}`}
              className={cn(
                'flex items-center gap-2.5 rounded-[var(--radius-md)] transition-colors',
                collapsed ? 'h-8 w-8 justify-center' : 'h-8 px-2',
                active
                  ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-[13px] font-medium truncate">{item.label}</span>}
            </Link>
          )
          if (collapsed) {
            return <Tooltip key={item.href} content={item.label} side="right">{content}</Tooltip>
          }
          return <div key={item.href}>{content}</div>
        })}
      </nav>

      <div className="border-t border-[var(--border-subtle)] px-2 py-2 space-y-0.5">
        <ThemeToggle collapsed={collapsed} />
        {(() => {
          const active = isActive('/settings')
          const content = (
            <Link
              href={`${base}/settings`}
              className={cn(
                'flex items-center gap-2.5 rounded-[var(--radius-md)] transition-colors',
                collapsed ? 'h-8 w-8 justify-center' : 'h-8 px-2',
                active
                  ? 'bg-[var(--accent-muted)] text-[var(--accent-primary)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]',
              )}
            >
              <Settings className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="text-[13px] font-medium">Settings</span>}
            </Link>
          )
          if (collapsed) return <Tooltip content="Settings" side="right">{content}</Tooltip>
          return content
        })()}
        <LogoutButton collapsed={collapsed} />
      </div>

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

function LogoutButton({ collapsed }: { collapsed: boolean }) {
  const handleLogout = async () => {
    const supabase = getSupabaseClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const btn = (
    <button
      onClick={handleLogout}
      className={cn(
        'flex items-center gap-2.5 rounded-[var(--radius-md)] transition-colors w-full',
        collapsed ? 'h-8 w-8 justify-center' : 'h-8 px-2',
        'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]',
      )}
    >
      <LogOut className="h-4 w-4 shrink-0" />
      {!collapsed && <span className="text-[13px] font-medium">Déconnexion</span>}
    </button>
  )

  if (collapsed) return <Tooltip content="Déconnexion" side="right">{btn}</Tooltip>
  return btn
}
