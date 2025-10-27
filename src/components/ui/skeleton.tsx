// ==========================================
// SKELETON COMPONENT
// ==========================================
// Loading skeleton component for placeholder content

'use client'

import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

// ==========================================
// SKELETON COMPONENT
// ==========================================

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      {...props}
    />
  )
}

export { Skeleton }
export type { SkeletonProps }