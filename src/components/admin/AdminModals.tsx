/**
 * Admin Modals (Day 15)
 * 
 * Modal components for admin actions:
 * - Offline payment modal
 * - Override booking modal
 */

'use client'

import { useState } from 'react'
import { X, DollarSign, AlertCircle } from 'lucide-react'
import type { BookingListItem } from '@/redux/slices/bookingSlice'
import type { OfflinePaymentMethod, OverrideAction } from '@/lib/validation/admin.validation'

// ===========================================
// OFFLINE PAYMENT MODAL
// ===========================================

interface OfflinePaymentModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingListItem | null
  onSubmit: (data: {
    amount: number
    method: OfflinePaymentMethod
    transactionReference?: string
    notes?: string
    receiptNumber?: string
  }) => Promise<void>
}

export function OfflinePaymentModal({
  isOpen,
  onClose,
  booking,
  onSubmit,
}: OfflinePaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<OfflinePaymentMethod>('CASH')
  const [transactionReference, setTransactionReference] = useState('')
  const [receiptNumber, setReceiptNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  if (!isOpen || !booking) return null
  
  const remainingAmount = booking.totalPrice - (booking.paidAmount || 0)
  const suggestedAmount = remainingAmount
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    const amountCents = Math.round(parseFloat(amount) * 100)
    
    if (isNaN(amountCents) || amountCents <= 0) {
      setError('Please enter a valid amount')
      return
    }
    
    if (amountCents > remainingAmount) {
      setError('Amount exceeds remaining balance')
      return
    }
    
    setLoading(true)
    
    try {
      const paymentData: any = {
        amount: amountCents,
        method,
      }
      
      if (transactionReference) paymentData.transactionReference = transactionReference
      if (receiptNumber) paymentData.receiptNumber = receiptNumber
      if (notes) paymentData.notes = notes
      
      await onSubmit(paymentData)
      
      // Reset form
      setAmount('')
      setMethod('CASH')
      setTransactionReference('')
      setReceiptNumber('')
      setNotes('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to process payment')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Mark Offline Payment
                </h3>
                <p className="text-sm text-gray-500">
                  Booking #{booking.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Booking Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">${(booking.totalPrice / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid:</span>
                <span className="font-medium text-green-600">
                  ${((booking.paidAmount || 0) / 100).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="text-gray-900 font-medium">Remaining:</span>
                <span className="font-semibold text-blue-600">
                  ${(remainingAmount / 100).toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={(suggestedAmount / 100).toFixed(2)}
                  step="0.01"
                  min="0.01"
                  max={(remainingAmount / 100).toFixed(2)}
                  required
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="button"
                onClick={() => setAmount((suggestedAmount / 100).toFixed(2))}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                Use remaining amount
              </button>
            </div>
            
            {/* Payment Method */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Payment Method *
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as OfflinePaymentMethod)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CARD_TERMINAL">Card Terminal</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            
            {/* Transaction Reference */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Transaction Reference
              </label>
              <input
                type="text"
                value={transactionReference}
                onChange={(e) => setTransactionReference(e.target.value)}
                placeholder="e.g., TXN-123456"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Receipt Number */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Receipt Number
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="e.g., RCP-001"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>
            
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Mark as Paid'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

// ===========================================
// OVERRIDE BOOKING MODAL
// ===========================================

interface OverrideBookingModalProps {
  isOpen: boolean
  onClose: () => void
  booking: BookingListItem | null
  onSubmit: (data: {
    action: OverrideAction
    reason: string
    newStatus?: 'CONFIRMED' | 'CANCELLED'
    newStartDate?: string
    newEndDate?: string
    newRoomsBooked?: number
  }) => Promise<void>
}

export function OverrideBookingModal({
  isOpen,
  onClose,
  booking,
  onSubmit,
}: OverrideBookingModalProps) {
  const [action, setAction] = useState<OverrideAction>('FORCE_CONFIRM')
  const [reason, setReason] = useState('')
  const [newStartDate, setNewStartDate] = useState('')
  const [newEndDate, setNewEndDate] = useState('')
  const [newRoomsBooked, setNewRoomsBooked] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  if (!isOpen || !booking) return null
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters')
      return
    }
    
    setLoading(true)
    
    try {
      const data: any = {
        action,
        reason: reason.trim(),
      }
      
      if (action === 'FORCE_CONFIRM') {
        data.newStatus = 'CONFIRMED'
      } else if (action === 'FORCE_CANCEL') {
        data.newStatus = 'CANCELLED'
      } else if (action === 'MODIFY_DATES') {
        if (!newStartDate || !newEndDate) {
          setError('Both start and end dates are required')
          setLoading(false)
          return
        }
        data.newStartDate = new Date(newStartDate).toISOString()
        data.newEndDate = new Date(newEndDate).toISOString()
      } else if (action === 'MODIFY_ROOMS') {
        const rooms = parseInt(newRoomsBooked)
        if (isNaN(rooms) || rooms < 1) {
          setError('Valid room count required')
          setLoading(false)
          return
        }
        data.newRoomsBooked = rooms
      }
      
      await onSubmit(data)
      
      // Reset form
      setReason('')
      setNewStartDate('')
      setNewEndDate('')
      setNewRoomsBooked('')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to override booking')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Override Booking
              </h3>
              <p className="text-sm text-gray-500">
                Booking #{booking.id.slice(0, 8)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Action */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Override Action *
              </label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as OverrideAction)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                <option value="FORCE_CONFIRM">Force Confirm</option>
                <option value="FORCE_CANCEL">Force Cancel</option>
                <option value="MODIFY_DATES">Modify Dates</option>
                <option value="MODIFY_ROOMS">Modify Room Count</option>
                <option value="WAIVE_DEPOSIT">Waive Deposit</option>
              </select>
            </div>
            
            {/* Conditional Fields */}
            {action === 'MODIFY_DATES' && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    New Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
            
            {action === 'MODIFY_ROOMS' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  New Room Count *
                </label>
                <input
                  type="number"
                  value={newRoomsBooked}
                  onChange={(e) => setNewRoomsBooked(e.target.value)}
                  min="1"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            )}
            
            {/* Reason */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Reason for Override * (min 10 characters)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this override is necessary..."
                rows={4}
                minLength={10}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-500">
                {reason.length}/10 characters
              </p>
            </div>
            
            {/* Warning */}
            <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                This action will be logged in the audit trail. Make sure you have proper authorization.
              </p>
            </div>
            
            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 text-white bg-orange-600 hover:bg-orange-700 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Override Booking'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
