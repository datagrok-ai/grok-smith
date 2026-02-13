import { cn } from '../../lib/cn'

const variants = {
  default: 'bg-muted text-muted-foreground',
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  archived: 'bg-muted text-muted-foreground',
  success: 'bg-green-100 text-green-800',
  destructive: 'bg-red-100 text-red-800',
} as const

export type BadgeVariant = keyof typeof variants

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}
