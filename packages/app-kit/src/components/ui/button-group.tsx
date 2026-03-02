import { forwardRef } from 'react'

import { cn } from '../../lib/cn'

export const ButtonGroup = forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="group"
    className={cn(
      'inline-flex',
      '[&>*]:rounded-none [&>*:first-child]:rounded-l-md [&>*:last-child]:rounded-r-md',
      '[&>*+*]:-ml-px',
      className,
    )}
    {...props}
  />
))
ButtonGroup.displayName = 'ButtonGroup'
