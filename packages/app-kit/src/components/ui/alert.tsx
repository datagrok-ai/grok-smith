import { forwardRef } from 'react'

import { cn } from '../../lib/cn'

const variants = {
  destructive: 'border-destructive/50 bg-destructive/10 text-destructive',
  success: 'border-success/50 bg-success/10 text-success',
  info: 'border-info/50 bg-info/10 text-info',
  warning: 'border-warning/50 bg-warning/10 text-warning',
} as const

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: keyof typeof variants
}

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = 'info', ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(
        'rounded-lg border p-4',
        variants[variant],
        className,
      )}
      {...props}
    />
  ),
)
Alert.displayName = 'Alert'

export const AlertTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('font-semibold leading-none', className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = 'AlertTitle'

export const AlertDescription = forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('mt-1 text-sm', className)}
    {...props}
  />
))
AlertDescription.displayName = 'AlertDescription'
