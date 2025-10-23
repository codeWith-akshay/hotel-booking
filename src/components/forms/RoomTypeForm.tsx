// ==========================================
// ROOM TYPE FORM COMPONENT
// ==========================================
// Reusable form for creating/editing room types

'use client'

import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { createRoomType, updateRoomType } from '@/actions/rooms/room-type.action'
import type { RoomType } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface RoomTypeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  roomType?: RoomType // For edit mode
}

// Form validation schema
const roomTypeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  pricePerNight: z.number().min(10, 'Price must be at least $10').max(100000, 'Price too high'),
  totalRooms: z.number().min(1, 'Must have at least 1 room').max(1000, 'Too many rooms'),
})

type FormData = z.infer<typeof roomTypeFormSchema>

// ==========================================
// ROOM TYPE FORM COMPONENT
// ==========================================

/**
 * Room Type Form Component
 * Modal form for creating or editing room types
 * 
 * @example
 * ```tsx
 * <RoomTypeForm
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onSuccess={() => refetch()}
 *   roomType={selectedRoom} // Optional: for edit mode
 * />
 * ```
 */
export function RoomTypeForm({ open, onOpenChange, onSuccess, roomType }: RoomTypeFormProps) {
  const isEditMode = !!roomType

  // Form state
  const [formData, setFormData] = useState<FormData>({
    name: roomType?.name || '',
    description: roomType?.description || '',
    pricePerNight: roomType?.pricePerNight ? roomType.pricePerNight / 100 : 0, // Convert cents to dollars
    totalRooms: roomType?.totalRooms || 0,
  })

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Handle input change
   */
  const handleChange = (field: keyof FormData, value: string | number) => {
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
      roomTypeFormSchema.parse(formData)
      setErrors({})
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof FormData, string>> = {}
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
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError(null)

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Prepare data (convert price to cents)
      const submitData = {
        ...formData,
        pricePerNight: Math.round(formData.pricePerNight * 100), // Convert dollars to cents
      }

      let result

      if (isEditMode && roomType) {
        // Update existing room type
        result = await updateRoomType({
          id: roomType.id,
          ...submitData,
        })
      } else {
        // Create new room type
        result = await createRoomType(submitData)
      }

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
    if (roomType) {
      setFormData({
        name: roomType.name,
        description: roomType.description,
        pricePerNight: roomType.pricePerNight / 100,
        totalRooms: roomType.totalRooms,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        pricePerNight: 0,
        totalRooms: 0,
      })
    }
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

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Room Type' : 'Create Room Type'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode
                ? 'Update the room type details below.'
                : 'Add a new room type to your hotel inventory.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Server Error Alert */}
            {serverError && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{serverError}</p>
              </div>
            )}

            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" required>
                Room Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Deluxe Ocean View"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                error={errors.name}
                disabled={isSubmitting}
              />
            </div>

            {/* Description Field */}
            <div className="space-y-2">
              <Label htmlFor="description" required>
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe the room features, amenities, and highlights..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                error={errors.description}
                disabled={isSubmitting}
              />
            </div>

            {/* Price and Total Rooms Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Price Field */}
              <div className="space-y-2">
                <Label htmlFor="pricePerNight" required>
                  Price per Night ($)
                </Label>
                <Input
                  id="pricePerNight"
                  type="number"
                  placeholder="150.00"
                  value={formData.pricePerNight || ''}
                  onChange={(e) => handleChange('pricePerNight', parseFloat(e.target.value) || 0)}
                  step="0.01"
                  min="10"
                  max="100000"
                  error={errors.pricePerNight}
                  disabled={isSubmitting}
                />
              </div>

              {/* Total Rooms Field */}
              <div className="space-y-2">
                <Label htmlFor="totalRooms" required>
                  Total Rooms
                </Label>
                <Input
                  id="totalRooms"
                  type="number"
                  placeholder="20"
                  value={formData.totalRooms || ''}
                  onChange={(e) => handleChange('totalRooms', parseInt(e.target.value) || 0)}
                  min="1"
                  max="1000"
                  error={errors.totalRooms}
                  disabled={isSubmitting}
                />
              </div>
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
              {isEditMode ? 'Update Room Type' : 'Create Room Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
