/**
 * Export Buttons Component (Day 17)
 * 
 * CSV and PDF export functionality for reports
 */

'use client'

import { useState } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
import type { ExportFormat, ReportType } from '@/lib/validation/reports.validation'

interface ExportButtonsProps {
  reportType: ReportType
  startDate: string
  endDate: string
  roomTypeId?: string | undefined
  adminId: string
  onExportSuccess?: (filename: string) => void
  onExportError?: (error: string) => void
}

export function ExportButtons({
  reportType,
  startDate,
  endDate,
  roomTypeId,
  adminId,
  onExportSuccess,
  onExportError,
}: ExportButtonsProps) {
  const [exportingCSV, setExportingCSV] = useState(false)
  const [exportingPDF, setExportingPDF] = useState(false)

  const handleExport = async (format: ExportFormat) => {
    const setLoading = format === 'csv' ? setExportingCSV : setExportingPDF

    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          format,
          reportType,
          startDate,
          endDate,
          roomTypeId,
          includeCharts: format === 'pdf',
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }

      // Download the file
      if (result.data && result.filename) {
        const blob = new Blob(
          [atob(result.data)],
          { type: result.contentType || 'application/octet-stream' }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        onExportSuccess?.(result.filename)
      }
    } catch (error) {
      console.error(`Error exporting ${format.toUpperCase()}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      onExportError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-3">
      {/* CSV Export Button */}
      <button
        onClick={() => handleExport('csv')}
        disabled={exportingCSV}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-medium rounded-lg transition-colors duration-200"
      >
        {exportingCSV ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </>
        )}
      </button>

      {/* PDF Export Button (Stub) */}
      <button
        onClick={() => handleExport('pdf')}
        disabled={exportingPDF}
        className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors duration-200"
        title="PDF export coming soon"
      >
        {exportingPDF ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <FileText className="w-4 h-4" />
            <span>Export PDF</span>
          </>
        )}
      </button>
    </div>
  )
}

/**
 * Quick export button (simplified, single format)
 */
interface QuickExportButtonProps {
  format: ExportFormat
  reportType: ReportType
  startDate: string
  endDate: string
  adminId: string
  className?: string
}

export function QuickExportButton({
  format,
  reportType,
  startDate,
  endDate,
  adminId,
  className = '',
}: QuickExportButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/superadmin/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          format,
          reportType,
          startDate,
          endDate,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Export failed')
      }

      // Download the file
      if (result.data && result.filename) {
        const blob = new Blob(
          [atob(result.data)],
          { type: result.contentType || 'application/octet-stream' }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error(`Error exporting ${format.toUpperCase()}:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${className}`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      <span>{format.toUpperCase()}</span>
    </button>
  )
}
