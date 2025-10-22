// ==========================================
// STAT CARD COMPONENT
// ==========================================
// Reusable statistics card for dashboards
// Features: Icon, label, value, trend indicator, responsive

'use client'

import { type ReactNode } from 'react'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Trend direction for statistics
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * Color variants for stat cards
 */
export type StatCardVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info'

/**
 * Props for StatCard component
 */
export interface StatCardProps {
  /** Card title/label */
  label: string
  
  /** Main statistic value */
  value: string | number
  
  /** Optional icon (React node or emoji) */
  icon?: ReactNode
  
  /** Trend information */
  trend?: {
    /** Trend direction */
    direction: TrendDirection
    /** Trend value (e.g., "+12%") */
    value: string
    /** Trend label (e.g., "vs last month") */
    label?: string
  }
  
  /** Optional description/subtitle */
  description?: string
  
  /** Color variant */
  variant?: StatCardVariant
  
  /** Click handler */
  onClick?: () => void
  
  /** Additional CSS classes */
  className?: string
}

// ==========================================
// VARIANT STYLES
// ==========================================

const variantStyles: Record<StatCardVariant, string> = {
  primary: 'bg-blue-50 border-blue-200 text-blue-900',
  success: 'bg-green-50 border-green-200 text-green-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  danger: 'bg-red-50 border-red-200 text-red-900',
  info: 'bg-purple-50 border-purple-200 text-purple-900',
}

const iconBgStyles: Record<StatCardVariant, string> = {
  primary: 'bg-blue-100',
  success: 'bg-green-100',
  warning: 'bg-yellow-100',
  danger: 'bg-red-100',
  info: 'bg-purple-100',
}

const trendStyles: Record<TrendDirection, string> = {
  up: 'text-green-600',
  down: 'text-red-600',
  neutral: 'text-gray-600',
}

const trendIcons: Record<TrendDirection, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * StatCard Component
 * 
 * Displays a statistic with optional icon, trend, and description.
 * 
 * @example
 * ```tsx
 * <StatCard
 *   label="Total Bookings"
 *   value={1234}
 *   icon="📅"
 *   variant="primary"
 *   trend={{ direction: 'up', value: '+12%', label: 'vs last month' }}
 * />
 * ```
 */
export default function StatCard({
  label,
  value,
  icon,
  trend,
  description,
  variant = 'primary',
  onClick,
  className = '',
}: StatCardProps) {
  const baseClasses = 'rounded-lg border-2 p-6 transition-all duration-200'
  const interactiveClasses = onClick
    ? 'cursor-pointer hover:shadow-lg hover:scale-105'
    : ''
  const variantClasses = variantStyles[variant]

  return (
    <div
      className={`${baseClasses} ${variantClasses} ${interactiveClasses} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      <div className="flex items-start justify-between">
        {/* Left: Icon and content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {/* Icon */}
            {icon && (
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconBgStyles[variant]}`}
              >
                {typeof icon === 'string' ? (
                  <span className="text-2xl">{icon}</span>
                ) : (
                  icon
                )}
              </div>
            )}

            {/* Label */}
            <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
              {label}
            </h3>
          </div>

          {/* Value */}
          <p className="text-3xl font-bold mb-1">{value}</p>

          {/* Description */}
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </div>

        {/* Right: Trend */}
        {trend && (
          <div className="flex flex-col items-end">
            <div className={`flex items-center gap-1 font-semibold ${trendStyles[trend.direction]}`}>
              <span className="text-lg">{trendIcons[trend.direction]}</span>
              <span className="text-sm">{trend.value}</span>
            </div>
            {trend.label && (
              <p className="text-xs text-gray-500 mt-1">{trend.label}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// STAT CARD GRID
// ==========================================

/**
 * Props for StatCardGrid component
 */
export interface StatCardGridProps {
  /** Array of stat cards */
  children: ReactNode
  
  /** Number of columns (responsive grid) */
  columns?: 1 | 2 | 3 | 4
  
  /** Additional CSS classes */
  className?: string
}

/**
 * StatCardGrid Component
 * 
 * Grid container for StatCard components with responsive columns.
 * 
 * @example
 * ```tsx
 * <StatCardGrid columns={3}>
 *   <StatCard label="Total" value={100} />
 *   <StatCard label="Active" value={75} />
 *   <StatCard label="Pending" value={25} />
 * </StatCardGrid>
 * ```
 */
export function StatCardGrid({
  children,
  columns = 3,
  className = '',
}: StatCardGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-6 ${gridClasses[columns]} ${className}`}>
      {children}
    </div>
  )
}
