// ==========================================
// RESPONSIVE TABLE COMPONENT
// ==========================================
// Table that automatically converts to cards on mobile devices
// Features: Responsive design, accessibility, custom renderers

'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ResponsiveTableColumn<T = any> {
  /** Column header label */
  label: string
  /** Data key to access in row object */
  key: keyof T | string
  /** Custom render function */
  render?: (value: any, row: T, index: number) => ReactNode
  /** Column CSS classes */
  className?: string
  /** Hide column on mobile */
  hideOnMobile?: boolean
  /** Column width (desktop only) */
  width?: string
  /** Make column sortable */
  sortable?: boolean
}

export interface ResponsiveTableProps<T = any> {
  /** Array of data objects */
  data: T[]
  /** Column definitions */
  columns: ResponsiveTableColumn<T>[]
  /** Custom key extractor */
  keyExtractor?: (row: T, index: number) => string | number
  /** Show loading state */
  isLoading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Custom empty state component */
  emptyComponent?: ReactNode
  /** Additional CSS classes */
  className?: string
  /** Enable hover effect on rows */
  hoverable?: boolean
  /** Enable striped rows */
  striped?: boolean
  /** Mobile breakpoint (default: md) */
  mobileBreakpoint?: 'sm' | 'md' | 'lg'
  /** Custom card renderer for mobile */
  renderMobileCard?: (row: T, index: number) => ReactNode
  /** Sort handler */
  onSort?: (key: string) => void
  /** Current sort key */
  sortKey?: string
  /** Current sort direction */
  sortDirection?: 'asc' | 'desc'
}

// ==========================================
// RESPONSIVE TABLE COMPONENT
// ==========================================

/**
 * Responsive Table Component
 * 
 * Automatically converts to card layout on mobile devices.
 * Supports custom renderers, sorting, loading states, and more.
 * 
 * @example
 * ```tsx
 * <ResponsiveTable
 *   data={bookings}
 *   columns={[
 *     { label: 'Guest', key: 'guestName' },
 *     { label: 'Room', key: 'roomNumber' },
 *     { label: 'Status', key: 'status', render: (status) => <StatusBadge status={status} /> }
 *   ]}
 * />
 * ```
 */
export function ResponsiveTable<T = any>({
  data,
  columns,
  keyExtractor = (_, index) => index,
  isLoading = false,
  emptyMessage = 'No data available',
  emptyComponent,
  className,
  hoverable = true,
  striped = false,
  mobileBreakpoint = 'md',
  renderMobileCard,
  onSort,
  sortKey,
  sortDirection,
}: ResponsiveTableProps<T>) {
  // ==========================================
  // GET VALUE FROM OBJECT
  // ==========================================
  const getValue = (obj: T, key: string): any => {
    return key.split('.').reduce((acc: any, part) => acc?.[part], obj as any)
  }

  // ==========================================
  // HANDLE SORT
  // ==========================================
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key)
    }
  }

  // ==========================================
  // RENDER LOADING STATE
  // ==========================================
  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Desktop Loading */}
        <div className={`hidden ${mobileBreakpoint}:block`}>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {columns.map((column, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="border-t border-gray-200">
                    {columns.map((_, index) => (
                      <td key={index} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Loading */}
        <div className={`${mobileBreakpoint}:hidden space-y-3`}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER EMPTY STATE
  // ==========================================
  if (!data || data.length === 0) {
    return (
      <div className={cn('border border-gray-200 rounded-lg p-8', className)}>
        {emptyComponent || (
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="mt-4 text-sm text-gray-500">{emptyMessage}</p>
          </div>
        )}
      </div>
    )
  }

  // ==========================================
  // RENDER TABLE (DESKTOP VIEW)
  // ==========================================
  const renderDesktopTable = () => (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead className="bg-linear-to-r from-gray-50 to-gray-100" role="rowgroup">
            <tr role="row">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider',
                    column.className,
                    column.sortable && 'cursor-pointer hover:bg-gray-200 transition-colors duration-200',
                    column.hideOnMobile && `hidden ${mobileBreakpoint}:table-cell`
                  )}
                  style={column.width ? { width: column.width } : undefined}
                  onClick={() => column.sortable && handleSort(column.key as string)}
                  role="columnheader"
                  aria-sort={
                    sortKey === column.key
                      ? sortDirection === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {column.sortable && sortKey === column.key && (
                      <svg
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          sortDirection === 'desc' && 'rotate-180'
                        )}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200" role="rowgroup">
            {data.map((row, rowIndex) => (
              <tr
                key={keyExtractor(row, rowIndex)}
                className={cn(
                  'transition-colors duration-200',
                  hoverable && 'hover:bg-gray-50',
                  striped && rowIndex % 2 === 1 && 'bg-gray-50/50'
                )}
                role="row"
              >
                {columns.map((column, colIndex) => {
                  const value = getValue(row, column.key as string)
                  const renderedValue = column.render
                    ? column.render(value, row, rowIndex)
                    : value

                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        'px-4 py-3 text-sm text-gray-900',
                        column.className,
                        column.hideOnMobile && `hidden ${mobileBreakpoint}:table-cell`
                      )}
                      role="cell"
                    >
                      {renderedValue}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  // ==========================================
  // RENDER CARDS (MOBILE VIEW)
  // ==========================================
  const renderMobileCards = () => (
    <div className="space-y-4" role="list">
      {data.map((row, index) => {
        const key = keyExtractor(row, index)

        if (renderMobileCard) {
          return (
            <div key={key} role="listitem">
              {renderMobileCard(row, index)}
            </div>
          )
        }

        return (
          <div
            key={key}
            className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-all duration-200 card-hover"
            role="listitem"
          >
            <div className="space-y-3">
              {columns.map((column, colIndex) => {
                const value = getValue(row, column.key as string)
                const renderedValue = column.render
                  ? column.render(value, row, index)
                  : value

                return (
                  <div
                    key={colIndex}
                    className={cn(
                      'flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1',
                      column.hideOnMobile && 'hidden'
                    )}
                  >
                    <span className="text-xs font-medium text-gray-500 uppercase">
                      {column.label}
                    </span>
                    <span className="text-sm text-gray-900 wrap-break-word">
                      {renderedValue || '-'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )

  // ==========================================
  // RENDER COMPONENT
  // ==========================================
  return (
    <div className={className}>
      {/* Desktop View */}
      <div className={`hidden ${mobileBreakpoint}:block`} aria-label="Desktop table view">
        {renderDesktopTable()}
      </div>

      {/* Mobile View */}
      <div className={`${mobileBreakpoint}:hidden`} aria-label="Mobile card view">
        {renderMobileCards()}
      </div>
    </div>
  )
}

// ==========================================
// EXPORT
// ==========================================
export default ResponsiveTable
