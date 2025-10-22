// ==========================================
// DATA TABLE COMPONENT
// ==========================================
// Reusable data table with sorting and responsive design
// Features: Generic types, sortable columns, empty state

'use client'

import { useState, useMemo } from 'react'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc' | null

/**
 * Column definition for DataTable
 */
export interface Column<T> {
  /** Column header label */
  label: string
  
  /** Accessor key for data */
  key: keyof T | string
  
  /** Custom render function */
  render?: (row: T) => React.ReactNode
  
  /** Enable sorting for this column */
  sortable?: boolean
  
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number
  
  /** Column width (CSS class) */
  width?: string
  
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
}

/**
 * Props for DataTable component
 */
export interface DataTableProps<T> {
  /** Array of data rows */
  data: T[]
  
  /** Column definitions */
  columns: Column<T>[]
  
  /** Unique key extractor */
  keyExtractor: (row: T, index: number) => string
  
  /** Empty state message */
  emptyMessage?: string
  
  /** Loading state */
  loading?: boolean
  
  /** Row click handler */
  onRowClick?: (row: T) => void
  
  /** Additional CSS classes for table */
  className?: string
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get nested property value from object
 */
function getNestedValue<T>(obj: T, path: string): any {
  return path.split('.').reduce((acc: any, part) => acc?.[part], obj)
}

/**
 * Default sort function
 */
function defaultSort<T>(a: T, b: T, key: string): number {
  const aValue = getNestedValue(a, key)
  const bValue = getNestedValue(b, key)

  if (aValue === bValue) return 0
  if (aValue == null) return 1
  if (bValue == null) return -1

  // Handle dates
  if (aValue instanceof Date && bValue instanceof Date) {
    return aValue.getTime() - bValue.getTime()
  }

  // Handle numbers
  if (typeof aValue === 'number' && typeof bValue === 'number') {
    return aValue - bValue
  }

  // Handle strings
  return String(aValue).localeCompare(String(bValue))
}

// ==========================================
// COMPONENT
// ==========================================

/**
 * DataTable Component
 * 
 * Generic, reusable data table with sorting and responsive design.
 * 
 * @example
 * ```tsx
 * interface User {
 *   id: string
 *   name: string
 *   email: string
 *   role: string
 * }
 * 
 * const columns: Column<User>[] = [
 *   { label: 'Name', key: 'name', sortable: true },
 *   { label: 'Email', key: 'email', sortable: true },
 *   { label: 'Role', key: 'role', render: (user) => <Badge>{user.role}</Badge> },
 * ]
 * 
 * <DataTable
 *   data={users}
 *   columns={columns}
 *   keyExtractor={(user) => user.id}
 * />
 * ```
 */
export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  emptyMessage = 'No data available',
  loading = false,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)

  // ==========================================
  // SORTING LOGIC
  // ==========================================

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return

    const key = String(column.key)

    if (sortKey === key) {
      // Cycle: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortKey(null)
      }
    } else {
      setSortKey(key)
      setSortDirection('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data

    const column = columns.find((col) => String(col.key) === sortKey)
    if (!column) return data

    const sorted = [...data].sort((a, b) => {
      const result = column.sortFn
        ? column.sortFn(a, b)
        : defaultSort(a, b, sortKey)

      return sortDirection === 'asc' ? result : -result
    })

    return sorted
  }, [data, sortKey, sortDirection, columns])

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null

    const key = String(column.key)
    const isActive = sortKey === key

    return (
      <span className="ml-2 inline-block">
        {!isActive && <span className="text-gray-400">⇅</span>}
        {isActive && sortDirection === 'asc' && <span className="text-blue-600">↑</span>}
        {isActive && sortDirection === 'desc' && <span className="text-blue-600">↓</span>}
      </span>
    )
  }

  const renderCellContent = (row: T, column: Column<T>) => {
    if (column.render) {
      return column.render(row)
    }

    const value = getNestedValue(row, String(column.key))
    
    // Handle dates
    if (value instanceof Date) {
      return value.toLocaleDateString()
    }

    return value ?? '-'
  }

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  // ==========================================
  // EMPTY STATE
  // ==========================================

  if (sortedData.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  // ==========================================
  // TABLE RENDER
  // ==========================================

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {/* Table Header */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                onClick={() => handleSort(column)}
                className={`
                  px-6 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider
                  ${column.sortable ? 'cursor-pointer hover:bg-gray-100 select-none' : ''}
                  ${column.align === 'center' ? 'text-center' : ''}
                  ${column.align === 'right' ? 'text-right' : 'text-left'}
                  ${column.width || ''}
                `}
              >
                <div className="flex items-center justify-between">
                  <span>{column.label}</span>
                  {renderSortIcon(column)}
                </div>
              </th>
            ))}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedData.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row, rowIndex)}
              onClick={() => onRowClick?.(row)}
              className={`
                transition-colors duration-150
                ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
              `}
            >
              {columns.map((column, colIndex) => (
                <td
                  key={colIndex}
                  className={`
                    px-6 py-4 whitespace-nowrap text-sm text-gray-900
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : 'text-left'}
                  `}
                >
                  {renderCellContent(row, column)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ==========================================
// BADGE COMPONENT (UTILITY)
// ==========================================

/**
 * Badge component for table cells
 */
export function Badge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
}) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variants[variant]}
      `}
    >
      {children}
    </span>
  )
}
