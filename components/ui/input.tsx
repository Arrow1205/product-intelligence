import { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'w-full h-9 px-3 text-[13px] rounded-[var(--radius-md)]',
      'bg-[var(--surface-secondary)] border border-[var(--border-subtle)]',
      'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
      'transition-colors',
      'hover:border-[var(--border-strong)]',
      'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-muted)]',
      error && 'border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger-muted)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'w-full px-3 py-2 text-[13px] rounded-[var(--radius-md)]',
      'bg-[var(--surface-secondary)] border border-[var(--border-subtle)]',
      'text-[var(--text-primary)] placeholder:text-[var(--text-muted)]',
      'resize-none transition-colors',
      'hover:border-[var(--border-strong)]',
      'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-muted)]',
      error && 'border-[var(--danger)]',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, error, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'w-full h-9 px-3 text-[13px] rounded-[var(--radius-md)]',
      'bg-[var(--surface-secondary)] border border-[var(--border-subtle)]',
      'text-[var(--text-primary)]',
      'transition-colors cursor-pointer',
      'hover:border-[var(--border-strong)]',
      'focus:outline-none focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-muted)]',
      error && 'border-[var(--danger)]',
      className,
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = 'Select'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn('block text-[12px] font-medium text-[var(--text-secondary)] mb-1', className)}
      {...props}
    >
      {children}
      {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
    </label>
  )
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-[11px] text-[var(--danger)]">{message}</p>
}
