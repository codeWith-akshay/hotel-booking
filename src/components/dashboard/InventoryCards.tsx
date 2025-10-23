// ==========================================
// INVENTORY CARDS COMPONENT
// ==========================================
// Mobile-responsive card view for inventory

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateInventory } from '@/actions/rooms/room-inventory.action'
import type { RoomInventory } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface InventoryCardsProps {
  inventory: RoomInventory[]
  roomTypeId: string
  totalRooms: number
  onUpdate: () => void
  onShowToast: (message: string, type: 'success' | 'error') => void
}

interface EditState {
  id: string
  value: number
}

// ==========================================
// INVENTORY CARDS COMPONENT
// ==========================================

/**
 * Inventory Cards Component
 * Mobile-friendly card view for inventory data
 * 
 * @example
 * ```tsx
 * <InventoryCards
 *   inventory={inventoryData}
 *   roomTypeId="clx123"
 *   totalRooms={20}
 *   onUpdate={() => refetch()}
 *   onShowToast={showToast}
 * />
 * ```
 */
export function InventoryCards({
  inventory,
  roomTypeId,
  totalRooms,
  onUpdate,
  onShowToast,
}: InventoryCardsProps) {
  // ==========================================
  // STATE
  // ==========================================

  const [editingCard, setEditingCard] = useState<EditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Start editing a card
   */
  const handleStartEdit = (inv: RoomInventory) => {
    setEditingCard({
      id: inv.id,
      value: inv.availableRooms,
    })
  }

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingCard(null)
  }

  /**
   * Save edited value
   */
  const handleSaveEdit = async (inv: RoomInventory) => {
    if (!editingCard) return

    // Validate value
    if (editingCard.value < 0) {
      onShowToast('Available rooms cannot be negative', 'error')
      return
    }

    if (editingCard.value > totalRooms) {
      onShowToast(`Available rooms cannot exceed total rooms (${totalRooms})`, 'error')
      return
    }

    setIsSaving(true)

    try {
      const result = await updateInventory({
        id: inv.id,
        availableRooms: editingCard.value,
      })

      if (result.success) {
        onShowToast('Availability updated successfully', 'success')
        setEditingCard(null)
        onUpdate()
      } else {
        onShowToast(result.message || 'Failed to update availability', 'error')
      }
    } catch (error) {
      console.error('Error updating inventory:', error)
      onShowToast('An unexpected error occurred', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Format date for display
   */
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  /**
   * Check if date is in the past
   */
  const isPastDate = (date: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return new Date(date) < today
  }

  /**
   * Get occupancy percentage
   */
  const getOccupancy = (available: number) => {
    return Math.round(((totalRooms - available) / totalRooms) * 100)
  }

  /**
   * Get occupancy badge color
   */
  const getOccupancyBadge = (occupancy: number) => {
    if (occupancy >= 90) return 'bg-red-100 text-red-800'
    if (occupancy >= 70) return 'bg-orange-100 text-orange-800'
    if (occupancy >= 50) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
  }

  // ==========================================
  // RENDER
  // ==========================================

  if (inventory.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No inventory found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating inventory for this room type
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {inventory.map((inv) => {
        const isEditing = editingCard?.id === inv.id
        const isPast = isPastDate(inv.date)
        const occupancy = getOccupancy(inv.availableRooms)

        return (
          <div
            key={inv.id}
            className={`bg-white rounded-lg border border-gray-200 p-4 ${
              isPast ? 'opacity-60' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {formatDate(inv.date)}
                </h3>
                {isPast && (
                  <span className="inline-block mt-1 text-xs text-gray-500">
                    Past Date
                  </span>
                )}
              </div>
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getOccupancyBadge(
                  occupancy
                )}`}
              >
                {occupancy}% Occupied
              </span>
            </div>

            {/* Availability */}
            <div className="space-y-3">
              {isEditing ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Rooms
                  </label>
                  <Input
                    type="number"
                    value={editingCard.value}
                    onChange={(e) =>
                      setEditingCard({
                        ...editingCard,
                        value: parseInt(e.target.value) || 0,
                      })
                    }
                    min="0"
                    max={totalRooms}
                    disabled={isSaving}
                    autoFocus
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Total rooms: {totalRooms}
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-3xl font-bold text-gray-900">
                      {inv.availableRooms}
                    </span>
                    <span className="text-gray-500">/ {totalRooms}</span>
                  </div>
                  <p className="text-sm text-gray-600">rooms available</p>
                </div>
              )}

              {/* Occupancy Bar */}
              {!isEditing && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      occupancy >= 90
                        ? 'bg-red-600'
                        : occupancy >= 70
                        ? 'bg-orange-600'
                        : occupancy >= 50
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{ width: `${occupancy}%` }}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    className="flex-1"
                    onClick={() => handleSaveEdit(inv)}
                    isLoading={isSaving}
                    disabled={isSaving}
                  >
                    Save Changes
                  </Button>
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleStartEdit(inv)}
                  disabled={isPast}
                >
                  <svg
                    className="h-4 w-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {isPast ? 'Cannot Edit Past Date' : 'Edit Availability'}
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
