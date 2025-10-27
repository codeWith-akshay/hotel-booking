// ==========================================
// CARD COMPONENT
// ==========================================
// Reusable card component for content containers

'use client'

import { forwardRef, HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

// ==========================================
// CARD COMPONENT
// ==========================================

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        className
      )}
      {...props}
    />
  )
)

Card.displayName = 'Card'

// ==========================================
// CARD HEADER COMPONENT
// ==========================================

const CardHeader = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
)

CardHeader.displayName = 'CardHeader'

// ==========================================
// CARD TITLE COMPONENT
// ==========================================

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
)

CardTitle.displayName = 'CardTitle'

// ==========================================
// CARD DESCRIPTION COMPONENT
// ==========================================

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)

CardDescription.displayName = 'CardDescription'

// ==========================================
// CARD CONTENT COMPONENT
// ==========================================

const CardContent = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('p-6 pt-0', className)}
      {...props}
    />
  )
)

CardContent.displayName = 'CardContent'

// ==========================================
// CARD FOOTER COMPONENT
// ==========================================

const CardFooter = forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
)

CardFooter.displayName = 'CardFooter'

// ==========================================
// EXPORTS
// ==========================================

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
export type { CardProps }