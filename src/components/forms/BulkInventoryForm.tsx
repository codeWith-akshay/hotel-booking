// ==========================================
// BULK INVENTORY FORM COMPONENT
// ==========================================
// Modal form for creating inventory for date range

'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createBulkInventory } from '@/actions/rooms/room-inventory.action'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface BulkInventoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  roomTypeId: string
  roomTypeName: string
  totalRooms: number
}

// Form validation schema
const bulkInventoryFormSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  availableRooms: z.number().min(0, 'Cannot be negative').optional(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end > start
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type FormData = {
  startDate: string
  endDate: string
  availableRooms: number | undefined
}

// ==========================================
// BULK INVENTORY FORM COMPONENT
// ==========================================

/**
 * Bulk Inventory Form Component
 * Modal form for creating inventory for multiple dates
 * 
 * @example
 * ```tsx
 * <BulkInventoryForm
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => refetch()}
 *   roomTypeId="clx123"
 *   roomTypeName="Deluxe Suite"
 *   totalRooms={20}
 * />
 * ```
 */
export function BulkInventoryForm({
  open,
  onOpenChange,
  onSuccess,
  roomTypeId,
  roomTypeName,
  totalRooms,
}: BulkInventoryFormProps) {
  // ==========================================
  // STATE
  // ==========================================

  // Get tomorrow's date as default start
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0] || ''

  // Get 30 days from now as default end
  const thirtyDaysLater = new Date()
  thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 31)
  const thirtyDaysStr = thirtyDaysLater.toISOString().split('T')[0] || ''

  const [formData, setFormData] = useState<FormData>({
    startDate: tomorrowStr || '',
    endDate: thirtyDaysStr || '',
    availableRooms: undefined, // Will default to totalRooms on server
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'general', string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Handle input change
   */
  const handleChange = (field: keyof FormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
    setServerError(null)
  }

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    try {
      bulkInventoryFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof FormData | 'general', string>> = {}
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof FormData] = err.message
          }
        })
        setErrors(fieldErrors)
      }
      return false
    }
  }

  /**
   * Calculate number of days
   */
  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0
    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)
    const diffTime = end.getTime() - start.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    // Additional validation for available rooms
    if (formData.availableRooms !== undefined && formData.availableRooms > totalRooms) {
      setErrors({ availableRooms: `Cannot exceed total rooms (${totalRooms})` })
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data
      const submitData = {
        roomTypeId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        availableRooms: formData.availableRooms,
      }

      const result = await createBulkInventory(submitData)

      if (result.success) {
        // Success: close modal and refresh
        onOpenChange(false)
        onSuccess()
        resetForm()
      } else {
        // Show server error
        setServerError(result.message || 'An error occurred')
      }
    } catch (error) {
      console.error('Form submission error:', error)
      setServerError('Failed to submit form. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setFormData({
      startDate: tomorrowStr,
      endDate: thirtyDaysStr,
      availableRooms: undefined,
    })
    setErrors({})
    setServerError(null)
  }

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isSubmitting) {
      resetForm()
      onOpenChange(false)
    }
  }

  const daysCount = calculateDays()

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Bulk Inventory</DialogTitle>
            <DialogDescription>
              Create inventory records for {roomTypeName} across multiple dates
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Server Error Alert */}
            {serverError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{serverError}</p>
              </div>
            )}

            {/* Date Range Info */}
            <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>Total Rooms:</strong> {totalRooms}
                  </p>
                  {daysCount > 0 && (
                    <p className="text-sm text-blue-800 mt-1">
                      This will create or update <strong>{daysCount} inventory records</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Start Date Field */}
            <div className="space-y-2">
              <Label htmlFor="startDate" required>
                Start Date
              </Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                error={errors.startDate}
                disabled={isSubmitting}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* End Date Field */}
            <div className="space-y-2">
              <Label htmlFor="endDate" required>
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                error={errors.endDate}
                disabled={isSubmitting}
                min={formData.startDate}
              />
            </div>

            {/* Available Rooms Field */}
            <div className="space-y-2">
              <Label htmlFor="availableRooms">
                Available Rooms (Optional)
              </Label>
              <Input
                id="availableRooms"
                type="number"
                placeholder={`Default: ${totalRooms} (all rooms)`}
                value={formData.availableRooms ?? ''}
                onChange={(e) =>
                  handleChange('availableRooms', e.target.value ? parseInt(e.target.value) : undefined)
                }
                min="0"
                max={totalRooms}
                error={errors.availableRooms}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Leave empty to use total rooms ({totalRooms})
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Inventory
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
