'use client'

import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils/cn'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'secondary', size = 'md', asChild, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-colors cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          {
            primary: 'bg-[var(--accent-primary)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] rounded-[var(--radius-md)]',
            secondary: 'bg-[var(--surface-secondary)] text-[var(--text-primary)] hover:bg-[var(--border-subtle)] rounded-[var(--radius-md)]',
            ghost: 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-md)]',
            danger: 'bg-[var(--danger-muted)] text-[var(--danger)] hover:bg-[var(--danger)] hover:text-white rounded-[var(--radius-md)]',
            outline: 'border border-[var(--border-strong)] text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-[var(--radius-md)]',
          }[variant],
          {
            sm: 'h-7 px-3 text-[12px]',
            md: 'h-8 px-3.5 text-[13px]',
            lg: 'h-10 px-5 text-[14px]',
            icon: 'h-8 w-8',
          }[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
            {children}
          </>
        ) : children}
      </Comp>
    )
  },
)
Button.displayName = 'Button'
