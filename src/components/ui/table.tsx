// ==========================================
// TABLE COMPONENTS
// ==========================================
// Reusable table components for data display

'use client'

import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

// ==========================================
// TABLE ROOT COMPONENT
// ==========================================

/**
 * Table Root Component
 * Container for table with responsive wrapper
 */
const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="w-full overflow-auto">
      <table
        ref={ref}
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  )
)
Table.displayName = 'Table'

// ==========================================
// TABLE HEADER COMPONENT
// ==========================================

/**
 * Table Header Component
 * Contains table header rows
 */
const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
  )
)
TableHeader.displayName = 'TableHeader'

// ==========================================
// TABLE BODY COMPONENT
// ==========================================

/**
 * Table Body Component
 * Contains table data rows
 */
const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tbody
      ref={ref}
      className={cn('[&_tr:last-child]:border-0', className)}
      {...props}
    />
  )
)
TableBody.displayName = 'TableBody'

// ==========================================
// TABLE FOOTER COMPONENT
// ==========================================

/**
 * Table Footer Component
 * Contains table footer rows
 */
const TableFooter = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => (
    <tfoot
      ref={ref}
      className={cn('bg-gray-50 font-medium', className)}
      {...props}
    />
  )
)
TableFooter.displayName = 'TableFooter'

// ==========================================
// TABLE ROW COMPONENT
// ==========================================

/**
 * Table Row Component
 * Single row in table
 */
const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors hover:bg-gray-50',
        'data-[state=selected]:bg-gray-100',
        className
      )}
      {...props}
    />
  )
)
TableRow.displayName = 'TableRow'

// ==========================================
// TABLE HEAD COMPONENT
// ==========================================

/**
 * Table Head Cell Component
 * Header cell in table
 */
const TableHead = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'h-12 px-4 text-left align-middle font-medium text-gray-600',
        '[&:has([role=checkbox])]:pr-0',
        className
      )}
      {...props}
    />
  )
)
TableHead.displayName = 'TableHead'

// ==========================================
// TABLE CELL COMPONENT
// ==========================================

/**
 * Table Data Cell Component
 * Data cell in table
 */
const TableCell = forwardRef<HTMLTableCellElement, HTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
)
TableCell.displayName = 'TableCell'

// ==========================================
// TABLE CAPTION COMPONENT
// ==========================================

/**
 * Table Caption Component
 * Caption/description for table
 */
const TableCaption = forwardRef<HTMLTableCaptionElement, HTMLAttributes<HTMLTableCaptionElement>>(
  ({ className, ...props }, ref) => (
    <caption
      ref={ref}
      className={cn('mt-4 text-sm text-gray-600', className)}
      {...props}
    />
  )
)
TableCaption.displayName = 'TableCaption'

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
