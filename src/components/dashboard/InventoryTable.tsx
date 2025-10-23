// ==========================================
// INVENTORY TABLE COMPONENT
// ==========================================
// Displays inventory data with inline editing

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { updateInventory, updateInventoryByDate } from '@/actions/rooms/room-inventory.action'
import type { RoomInventory } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface InventoryTableProps {
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
// INVENTORY TABLE COMPONENT
// ==========================================

/**
 * Inventory Table Component
 * Displays inventory with inline editing for availability
 * 
 * @example
 * ```tsx
 * <InventoryTable
 *   inventory={inventoryData}
 *   roomTypeId="clx123"
 *   totalRooms={20}
 *   onUpdate={() => refetch()}
 *   onShowToast={showToast}
 * />
 * ```
 */
export function InventoryTable({
  inventory,
  roomTypeId,
  totalRooms,
  onUpdate,
  onShowToast,
}: InventoryTableProps) {
  // ==========================================
  // STATE
  // ==========================================

  const [editingRow, setEditingRow] = useState<EditState | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Start editing a row
   */
  const handleStartEdit = (inv: RoomInventory) => {
    setEditingRow({
      id: inv.id,
      value: inv.availableRooms,
    })
  }

  /**
   * Cancel editing
   */
  const handleCancelEdit = () => {
    setEditingRow(null)
  }

  /**
   * Save edited value
   */
  const handleSaveEdit = async (inv: RoomInventory) => {
    if (!editingRow) return

    // Validate value
    if (editingRow.value < 0) {
      onShowToast('Available rooms cannot be negative', 'error')
      return
    }

    if (editingRow.value > totalRooms) {
      onShowToast(`Available rooms cannot exceed total rooms (${totalRooms})`, 'error')
      return
    }

    setIsSaving(true)

    try {
      const result = await updateInventory({
        id: inv.id,
        availableRooms: editingRow.value,
      })

      if (result.success) {
        onShowToast('Availability updated successfully', 'success')
        setEditingRow(null)
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  /**
   * Get day of week
   */
  const getDayOfWeek = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { weekday: 'short' })
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
   * Get occupancy color
   */
  const getOccupancyColor = (occupancy: number) => {
    if (occupancy >= 90) return 'text-red-600'
    if (occupancy >= 70) return 'text-orange-600'
    if (occupancy >= 50) return 'text-yellow-600'
    return 'text-green-600'
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
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Day</TableHead>
            <TableHead>Available</TableHead>
            <TableHead>Occupancy</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((inv) => {
            const isEditing = editingRow?.id === inv.id
            const isPast = isPastDate(inv.date)
            const occupancy = getOccupancy(inv.availableRooms)

            return (
              <TableRow key={inv.id} className={isPast ? 'bg-gray-50 opacity-60' : ''}>
                {/* Date */}
                <TableCell className="font-medium">
                  {formatDate(inv.date)}
                </TableCell>

                {/* Day of Week */}
                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                    {getDayOfWeek(inv.date)}
                  </span>
                </TableCell>

                {/* Available Rooms */}
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editingRow.value}
                      onChange={(e) =>
                        setEditingRow({
                          ...editingRow,
                          value: parseInt(e.target.value) || 0,
                        })
                      }
                      min="0"
                      max={totalRooms}
                      className="w-24"
                      disabled={isSaving}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(inv)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                    />
                  ) : (
                    <span className="text-lg font-semibold">
                      {inv.availableRooms} / {totalRooms}
                    </span>
                  )}
                </TableCell>

                {/* Occupancy */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                      <div
                        className={cn(
                          'h-2 rounded-full transition-all',
                          occupancy >= 90 ? 'bg-red-600' :
                          occupancy >= 70 ? 'bg-orange-600' :
                          occupancy >= 50 ? 'bg-yellow-600' :
                          'bg-green-600'
                        )}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                    <span className={cn('text-sm font-medium', getOccupancyColor(occupancy))}>
                      {occupancy}%
                    </span>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(inv)}
                        isLoading={isSaving}
                        disabled={isSaving}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleStartEdit(inv)}
                      disabled={isPast}
                      title={isPast ? 'Cannot edit past dates' : 'Edit availability'}
                    >
                      <svg
                        className="h-4 w-4"
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
                      <span className="ml-1 hidden sm:inline">Edit</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// Helper function for className (if not already imported)
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
