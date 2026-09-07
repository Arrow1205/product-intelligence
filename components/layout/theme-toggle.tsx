'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from './theme-provider'
import { Tooltip } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils/cn'

const options = [
  { value: 'light' as const, icon: Sun, label: 'Light mode' },
  { value: 'dark' as const, icon: Moon, label: 'Dark mode' },
  { value: 'system' as const, icon: Monitor, label: 'System mode' },
]

export function ThemeToggle({ collapsed }: { collapsed?: boolean }) {
  const { theme, setTheme } = useTheme()

  if (collapsed) {
    const current = options.find((o) => o.value === theme) ?? options[2]
    const Icon = current.icon
    return (
      <Tooltip content="Theme" side="right">
        <button
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] transition-colors"
          onClick={() => {
            const idx = options.findIndex((o) => o.value === theme)
            setTheme(options[(idx + 1) % options.length].value)
          }}
          aria-label="Toggle theme"
        >
          <Icon className="h-4 w-4" />
        </button>
      </Tooltip>
    )
  }

  return (
    <div className="flex items-center gap-0.5 rounded-[var(--radius-md)] bg-[var(--surface-secondary)] p-0.5">
      {options.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value} content={label}>
          <button
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-1 items-center justify-center h-6 rounded-[var(--radius-sm)] transition-colors',
              theme === value
                ? 'bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]',
            )}
            aria-label={label}
            aria-pressed={theme === value}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      ))}
    </div>
  )
}
