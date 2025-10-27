// ==========================================
// ADMIN ROOMS PAGE
// ==========================================
// Manage room types with table view and CRUD operations

'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Toast } from '@/components/ui/Toast'
import { RoomTypeForm } from '@/components/forms/RoomTypeForm'
import { getRoomTypes, deleteRoomType } from '@/actions/rooms/room-type.action'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import type { RoomType } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

// ==========================================
// ADMIN ROOMS PAGE COMPONENT
// ==========================================

/**
 * Admin Rooms Page Content
 * Displays room types in a table with CRUD operations
 */
function AdminRoomsContent() {
  // ==========================================
  // STATE
  // ==========================================

  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Selected room for edit/delete
  const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null)

  // Delete operation state
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast notification state
  const [toast, setToast] = useState<ToastState | null>(null)

  // ==========================================
  // DATA FETCHING
  // ==========================================

  /**
   * Fetch room types from server
   */
  const fetchRoomTypes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getRoomTypes({
        sortBy: 'name',
        sortOrder: 'asc',
      })

      if (result.success && result.data) {
        setRoomTypes(result.data)
      } else {
        setError(result.message || 'Failed to load room types')
      }
    } catch (err) {
      console.error('Error fetching room types:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch data on component mount
   */
  useEffect(() => {
    fetchRoomTypes()
  }, [])

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Handle create button click
   */
  const handleCreate = () => {
    setIsCreateModalOpen(true)
  }

  /**
   * Handle edit button click
   */
  const handleEdit = (room: RoomType) => {
    setSelectedRoom(room)
    setIsEditModalOpen(true)
  }

  /**
   * Handle delete button click
   */
  const handleDeleteClick = (room: RoomType) => {
    setSelectedRoom(room)
    setIsDeleteModalOpen(true)
  }

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!selectedRoom) return

    setIsDeleting(true)

    try {
      const result = await deleteRoomType({ id: selectedRoom.id })

      if (result.success) {
        // Close modal
        setIsDeleteModalOpen(false)
        setSelectedRoom(null)

        // Show success toast
        showToast('Room type deleted successfully', 'success')

        // Refresh data
        fetchRoomTypes()
      } else {
        showToast(result.message || 'Failed to delete room type', 'error')
      }
    } catch (err) {
      console.error('Error deleting room type:', err)
      showToast('An unexpected error occurred', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  /**
   * Handle form success (create/edit)
   */
  const handleFormSuccess = () => {
    showToast(
      selectedRoom ? 'Room type updated successfully' : 'Room type created successfully',
      'success'
    )
    fetchRoomTypes()
  }

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ message, type })
  }

  /**
   * Format price for display
   */
  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`
  }

  // ==========================================
  // RENDER
  // ==========================================

  const actions = (
    <Button onClick={() => setIsCreateModalOpen(true)}>
      <Plus className="mr-2 h-4 w-4" />
      Add Room Type
    </Button>
  );

  return (
    <AdminLayout
      title="Room Types"
      subtitle="Manage your hotel room types and inventory"
      actions={actions}
    >
      <div className="space-y-6">
      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoomTypes}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-gray-600">Loading room types...</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && roomTypes.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No room types found
          </h3>
          <p className="mt-2 text-gray-600">
            Get started by creating your first room type
          </p>
          <Button onClick={handleCreate} className="mt-4">
            Create Room Type
          </Button>
        </div>
      )}

      {/* Table View */}
      {!isLoading && !error && roomTypes.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Total Rooms</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roomTypes.map((room) => (
                <TableRow key={room.id}>
                  {/* Room Name */}
                  <TableCell className="font-medium">{room.name}</TableCell>

                  {/* Description (hidden on mobile) */}
                  <TableCell className="hidden md:table-cell max-w-md">
                    <p className="truncate text-gray-600">
                      {room.description}
                    </p>
                  </TableCell>

                  {/* Price */}
                  <TableCell className="font-semibold text-green-600">
                    {formatPrice(room.pricePerNight)}
                  </TableCell>

                  {/* Total Rooms */}
                  <TableCell>{room.totalRooms}</TableCell>

                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Edit Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(room)}
                        title="Edit room type"
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
                        <span className="hidden sm:inline ml-1">Edit</span>
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(room)}
                        title="Delete room type"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        <span className="hidden sm:inline ml-1">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Table Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Total: {roomTypes.length} room {roomTypes.length === 1 ? 'type' : 'types'}
            </p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <RoomTypeForm
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSuccess={handleFormSuccess}
      />

      {/* Edit Modal */}
      {selectedRoom && (
        <RoomTypeForm
          open={isEditModalOpen}
          onOpenChange={(open) => {
            setIsEditModalOpen(open)
            if (!open) setSelectedRoom(null)
          }}
          onSuccess={handleFormSuccess}
          roomType={selectedRoom}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Room Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedRoom?.name}"? This will
              permanently delete the room type and all associated inventory records.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-yellow-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="text-sm text-yellow-800">
                  <strong>Warning:</strong> This will delete all inventory records
                  associated with this room type.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              isLoading={isDeleting}
            >
              Delete Room Type
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      </div>
    </AdminLayout>
  );
}

export default function AdminRoomsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminRoomsContent />
    </ProtectedRoute>
  );
}
