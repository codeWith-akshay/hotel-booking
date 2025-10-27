/**
 * BulkMessageForm Component
 * 
 * Form for sending bulk messages via WhatsApp/Email:
 * - CSV upload with validation
 * - Message template with placeholders
 * - Channel selection (WhatsApp/Email)
 * - Progress tracking
 * - Results display
 */

'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  sendBulkMessages,
  setCsvRecipients,
  setCsvErrors,
  clearCsvData,
  setMessageTemplate,
  setCampaignTitle,
  setSelectedChannel,
  resetBulkMessageForm,
  selectCsvRecipients,
  selectCsvErrors,
  selectMessageTemplate,
  selectCampaignTitle,
  selectSelectedChannel,
  selectIsSending,
  selectSendProgress,
  selectSendError,
  selectCurrentCampaign,
  selectCsvStats,
  selectCanSendMessages,
} from '@/redux/slices/superAdminSlice'
import { parseCsvFile } from '@/actions/superadmin/bulkMessage'
import {
  Upload,
  FileText,
  Send,
  Mail,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Info,
  Download,
  X,
} from 'lucide-react'

interface BulkMessageFormProps {
  adminId: string
}

export default function BulkMessageForm({ adminId }: BulkMessageFormProps) {
  const dispatch = useAppDispatch()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const csvRecipients = useAppSelector(selectCsvRecipients)
  const csvErrors = useAppSelector(selectCsvErrors)
  const messageTemplate = useAppSelector(selectMessageTemplate)
  const campaignTitle = useAppSelector(selectCampaignTitle)
  const selectedChannel = useAppSelector(selectSelectedChannel)
  const isSending = useAppSelector(selectIsSending)
  const sendProgress = useAppSelector(selectSendProgress)
  const sendError = useAppSelector(selectSendError)
  const currentCampaign = useAppSelector(selectCurrentCampaign)
  const csvStats = useAppSelector(selectCsvStats)
  const canSend = useAppSelector(selectCanSendMessages)

  const [uploadError, setUploadError] = useState<string | null>(null)

  // Handle CSV upload
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadError(null)

    if (!file.name.endsWith('.csv')) {
      setUploadError('Please upload a CSV file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB')
      return
    }

    try {
      const content = await file.text()
      const result = await parseCsvFile(content)

      if (result.success && result.data) {
        dispatch(setCsvRecipients(result.data.recipients))

        if (result.data.errors && result.data.errors.length > 0) {
          dispatch(setCsvErrors(result.data.errors))
        }
      } else {
        setUploadError(result.error || 'Failed to parse CSV')
      }
    } catch (error) {
      setUploadError('Failed to read CSV file')
    }
  }

  // Handle send
  const handleSend = async () => {
    if (!canSend) return

    if (csvRecipients.length === 0) {
      setUploadError('No valid recipients found. Please check your CSV file and ensure it has valid data.')
      return
    }

    await dispatch(
      sendBulkMessages({
        adminId,
        title: campaignTitle,
        messageContent: messageTemplate,
        channel: selectedChannel,
        recipients: csvRecipients,
      })
    )
  }

  // Handle reset
  const handleReset = () => {
    if (isSending) return
    if (!confirm('Are you sure you want to reset the form?')) return

    dispatch(resetBulkMessageForm())
    setUploadError(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Download sample CSV
  const downloadSampleCsv = () => {
    const csv = 'name,phone,email\nJohn Doe,+14155552671,john@example.com\nJane Smith,+14155552672,jane@example.com'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample_recipients.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-green-600 to-teal-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Send className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Bulk Messaging</h2>
            <p className="text-green-100">Send messages via WhatsApp or Email</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Success Message */}
        {currentCampaign && sendProgress === 100 && !isSending && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-green-900">Campaign Completed Successfully!</p>
                <div className="mt-2 text-sm text-green-800 space-y-1">
                  <p>Campaign ID: {currentCampaign.id}</p>
                  <p>
                    Sent: {currentCampaign.sentCount} / {currentCampaign.totalRecipients} (
                    {((currentCampaign.sentCount / currentCampaign.totalRecipients) * 100).toFixed(1)}%)
                  </p>
                  {currentCampaign.failedCount > 0 && (
                    <p className="text-red-700">Failed: {currentCampaign.failedCount}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => dispatch(resetBulkMessageForm())}
                className="p-1 hover:bg-green-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-green-700" />
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {sendError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-red-800">{sendError}</span>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">How to use bulk messaging:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Upload a CSV file with recipient data (name, phone, email)</li>
              <li>Write your message with placeholders: {'{name}'}, {'{phone}'}, {'{email}'}</li>
              <li>Choose channel: WhatsApp (requires phone) or Email (requires email)</li>
              <li>Click Send to start the campaign</li>
            </ol>
          </div>
        </div>

        {/* Step 1: CSV Upload */}
        <div className="border border-gray-200 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Step 1: Upload Recipients (CSV)</h3>
            <button
              onClick={downloadSampleCsv}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              Sample CSV
            </button>
          </div>

          {/* File Input */}
          <div className="mb-4">
            <label
              htmlFor="csv-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-10 h-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">CSV file (max 5MB, up to 10,000 rows)</p>
              </div>
              <input
                ref={fileInputRef}
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                disabled={isSending}
                className="hidden"
              />
            </label>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {uploadError}
            </div>
          )}

          {/* CSV Stats */}
          {csvRecipients.length > 0 && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold text-gray-900">{csvStats.total}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Valid</p>
                <p className="text-2xl font-bold text-green-600">{csvStats.valid}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Errors</p>
                <p className="text-2xl font-bold text-red-600">{csvStats.invalid}</p>
              </div>
            </div>
          )}

          {/* CSV Errors */}
          {csvErrors && csvErrors.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="font-medium text-red-900 mb-2">
                {csvErrors.length} row{csvErrors.length > 1 ? 's' : ''} with errors:
              </p>
              <div className="max-h-40 overflow-y-auto space-y-2 text-sm text-red-800">
                {csvErrors.slice(0, 5).map((error: { row: number; errors: string[] }, index: number) => (
                  <div key={index}>
                    Row {error.row}: {error.errors.join(', ')}
                  </div>
                ))}
                {csvErrors.length > 5 && (
                  <div className="text-red-600">... and {csvErrors.length - 5} more errors</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Campaign Title */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Campaign Title</h3>
          <input
            type="text"
            value={campaignTitle}
            onChange={(e) => dispatch(setCampaignTitle(e.target.value))}
            disabled={isSending}
            placeholder="e.g., Holiday Promotion 2025"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-600">
            {campaignTitle.length}/200 characters (minimum 3 required)
          </p>
        </div>

        {/* Step 3: Message Template */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 3: Message Template</h3>
          
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Available placeholders:</p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                {'{name}'}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                {'{phone}'}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono">
                {'{email}'}
              </span>
            </div>
          </div>

          <textarea
            value={messageTemplate}
            onChange={(e) => dispatch(setMessageTemplate(e.target.value))}
            disabled={isSending}
            rows={6}
            placeholder="Hello {name}, we have a special offer for you..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <p className="mt-2 text-sm text-gray-600">
            {messageTemplate.length}/1000 characters (minimum 10 required)
          </p>
        </div>

        {/* Step 4: Channel Selection */}
        <div className="border border-gray-200 rounded-lg p-5">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 4: Select Channel</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => dispatch(setSelectedChannel('whatsapp'))}
              disabled={isSending}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedChannel === 'whatsapp'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <MessageSquare className={`w-10 h-10 mx-auto mb-3 ${
                selectedChannel === 'whatsapp' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <div className="text-center">
                <p className="font-semibold text-gray-900">WhatsApp</p>
                <p className="text-sm text-gray-600 mt-1">Requires phone number</p>
              </div>
            </button>

            <button
              onClick={() => dispatch(setSelectedChannel('email'))}
              disabled={isSending}
              className={`p-6 border-2 rounded-lg transition-all ${
                selectedChannel === 'email'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Mail className={`w-10 h-10 mx-auto mb-3 ${
                selectedChannel === 'email' ? 'text-blue-600' : 'text-gray-400'
              }`} />
              <div className="text-center">
                <p className="font-semibold text-gray-900">Email</p>
                <p className="text-sm text-gray-600 mt-1">Requires email address</p>
              </div>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {isSending && (
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="font-medium text-gray-900">Sending Messages...</p>
              <span className="text-sm text-gray-600">{sendProgress}%</span>
            </div>
            <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-green-500 to-teal-500 transition-all duration-300"
                style={{ width: `${sendProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={handleReset}
            disabled={isSending}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Reset Form
          </button>

          <button
            onClick={handleSend}
            disabled={!canSend || isSending}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg"
          >
            <Send className="w-5 h-5" />
            {isSending ? 'Sending...' : csvRecipients.length > 0 ? `Send to ${csvRecipients.length} Recipients` : 'Send Messages'}
          </button>
        </div>
      </div>
    </div>
  )
}
