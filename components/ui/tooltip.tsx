'use client'

import * as RadixTooltip from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils/cn'

interface TooltipProps {
  children: React.ReactNode
  content: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  delayDuration?: number
}

export function Tooltip({ children, content, side = 'top', align = 'center', delayDuration = 300 }: TooltipProps) {
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root>
        <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={6}
            className={cn(
              'z-50 max-w-xs rounded-[var(--radius-md)] px-3 py-2',
              'bg-[var(--text-primary)] text-[var(--text-inverse)]',
              'text-[12px] leading-relaxed shadow-[var(--shadow-lg)]',
              'animate-in fade-in-0 zoom-in-95',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
              'data-[side=bottom]:slide-in-from-top-2',
              'data-[side=top]:slide-in-from-bottom-2',
            )}
          >
            {content}
            <RadixTooltip.Arrow className="fill-[var(--text-primary)]" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  )
}

/* Help tooltip — "What / Why / How" pattern */
interface HelpTooltipProps {
  what: string
  why?: string
  how?: string
  children: React.ReactNode
}

export function HelpTooltip({ what, why, how, children }: HelpTooltipProps) {
  return (
    <Tooltip
      delayDuration={200}
      content={
        <div className="space-y-1.5">
          <p className="font-medium text-[var(--text-inverse)]">{what}</p>
          {why && <p className="text-[11px] opacity-75">{why}</p>}
          {how && <p className="text-[11px] opacity-60 italic">{how}</p>}
        </div>
      }
    >
      {children}
    </Tooltip>
  )
}
