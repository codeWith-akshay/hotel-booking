// ==========================================
// ADMIN INVENTORY PAGE
// ==========================================
// Manage room inventory with date-based pagination

'use client'

import { useEffect, useState } from 'react'
import AdminLayout from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Toast } from '@/components/ui/Toast'
import { InventoryTable } from '@/components/dashboard/InventoryTable'
import { InventoryCards } from '@/components/dashboard/InventoryCards'
import { BulkInventoryForm } from '@/components/forms/BulkInventoryForm'
import { getRoomTypes } from '@/actions/rooms/room-type.action'
import { getInventoryByRoomType } from '@/actions/rooms/room-inventory.action'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Plus, Calendar, Table as TableIcon, Grid } from 'lucide-react'
import type { RoomType, RoomInventory } from '@prisma/client'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ToastState {
  message: string
  type: 'success' | 'error' | 'info'
}

// ==========================================
// CONSTANTS
// ==========================================

const ITEMS_PER_PAGE = 30 // Show 30 days at a time

// ==========================================
// HELPERS
// ==========================================

/**
 * Get date range text
 */
const getDateRangeText = (inventory: RoomInventory[]) => {
  if (inventory.length === 0) return ''

  const firstInventory = inventory[0]
  const lastInventory = inventory[inventory.length - 1]
  
  if (!firstInventory || !lastInventory) return ''

  const firstDate = new Date(firstInventory.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  const lastDate = new Date(lastInventory.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return `${firstDate} - ${lastDate}`
}

// ==========================================
// ADMIN INVENTORY CONTENT COMPONENT
// ==========================================

function AdminInventoryContent() {
  // ==========================================
  // STATE
  // ==========================================

  // Room types
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [selectedRoomTypeId, setSelectedRoomTypeId] = useState<string>('')
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null)

  // Inventory data
  const [inventory, setInventory] = useState<RoomInventory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  // Modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)

  // View mode (table or cards)
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')

  // Toast notification
  const [toast, setToast] = useState<ToastState | null>(null)

  // ==========================================
  // DATA FETCHING
  // ==========================================

  /**
   * Fetch room types on mount
   */
  useEffect(() => {
    fetchRoomTypes()
  }, [])

  /**
   * Fetch room types from server
   */
  const fetchRoomTypes = async () => {
    try {
      const result = await getRoomTypes({
        sortBy: 'name',
        sortOrder: 'asc',
      })

      if (result.success && result.data) {
        setRoomTypes(result.data)
        // Auto-select first room type
        if (result.data.length > 0 && !selectedRoomTypeId && result.data[0]) {
          setSelectedRoomTypeId(result.data[0].id)
        }
      } else {
        showToast(result.message || 'Failed to load room types', 'error')
      }
    } catch (err) {
      console.error('Error fetching room types:', err)
      showToast('An unexpected error occurred', 'error')
    }
  }

  /**
   * Fetch inventory when room type or page changes
   */
  useEffect(() => {
    if (selectedRoomTypeId) {
      fetchInventory()
    }
  }, [selectedRoomTypeId, currentPage])

  /**
   * Update selected room type object when ID changes
   */
  useEffect(() => {
    if (selectedRoomTypeId) {
      const roomType = roomTypes.find((rt) => rt.id === selectedRoomTypeId)
      setSelectedRoomType(roomType || null)
    }
  }, [selectedRoomTypeId, roomTypes])

  /**
   * Fetch inventory from server
   */
  const fetchInventory = async () => {
    if (!selectedRoomTypeId) return

    setIsLoading(true)
    setError(null)

    try {
      // Calculate date range for current page
      const startDate = new Date()
      startDate.setDate(startDate.getDate() + currentPage * ITEMS_PER_PAGE)
      startDate.setHours(0, 0, 0, 0)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + ITEMS_PER_PAGE)

      const result = await getInventoryByRoomType({
        roomTypeId: selectedRoomTypeId,
        startDate,
        endDate,
        sortBy: 'date',
        sortOrder: 'asc',
      })

      if (result.success && result.data) {
        setInventory(result.data)
        setHasMore(result.data.length === ITEMS_PER_PAGE)
      } else {
        setError(result.message || 'Failed to load inventory')
      }
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  /**
   * Handle room type selection change
   */
  const handleRoomTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRoomTypeId(e.target.value)
    setCurrentPage(0) // Reset to first page
    setInventory([])
  }

  /**
   * Handle page navigation
   */
  const handleNextPage = () => {
    if (hasMore) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1)
    }
  }

  /**
   * Handle bulk modal open
   */
  const handleOpenBulkModal = () => {
    if (!selectedRoomTypeId) {
      showToast('Please select a room type first', 'error')
      return
    }
    setIsBulkModalOpen(true)
  }

  /**
   * Handle bulk update success
   */
  const handleBulkUpdateSuccess = () => {
    showToast('Inventory updated successfully', 'success')
    fetchInventory()
    setIsBulkModalOpen(false)
  }

  /**
   * Handle bulk creation success
   */
  const handleBulkSuccess = () => {
    showToast('Bulk inventory created successfully', 'success')
    fetchInventory()
    setIsBulkModalOpen(false)
  }

  /**
   * Show toast notification
   */
  const showToast = (message: string, type: ToastState['type']) => {
    setToast({ message, type })
  }

  /**
   * Close toast notification
   */
  const handleCloseToast = () => {
    setToast(null)
  }

  // ==========================================
  // RESPONSIVE VIEW MODE
  // ==========================================

  // Automatically switch to cards on mobile
  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 768
      setViewMode(isMobile ? 'cards' : 'table')
    }

    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ==========================================
  // RENDER
  // ==========================================

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
      >
        {viewMode === 'table' ? <Grid className="h-4 w-4 mr-2" /> : <TableIcon className="h-4 w-4 mr-2" />}
        {viewMode === 'table' ? 'Cards View' : 'Table View'}
      </Button>
      <Button onClick={() => setIsBulkModalOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Bulk Update
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Room Inventory"
      subtitle={selectedRoomType ? `Manage availability for ${selectedRoomType.name}` : 'Manage room availability across dates'}
      actions={actions}
    >
      <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Inventory</h1>
            <p className="mt-2 text-gray-600">
              Manage room availability across dates
            </p>
          </div>

          {/* Controls Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Room Type Selector */}
            <div className="flex-1 max-w-md">
              <Select
                label="Select Room Type"
                options={[
                  { value: '', label: '-- Select a room type --' },
                  ...roomTypes.map((rt) => ({
                    value: rt.id,
                    label: `${rt.name} (${rt.totalRooms} rooms)`,
                  })),
                ]}
                value={selectedRoomTypeId}
                onChange={handleRoomTypeChange}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleOpenBulkModal}
                disabled={!selectedRoomTypeId}
              >
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Inventory
              </Button>

              {/* View Toggle (Desktop only) */}
              <div className="hidden md:flex border border-gray-300 rounded-md">
                <button
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'table'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } rounded-l-md`}
                  onClick={() => setViewMode('table')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                <button
                  className={`px-3 py-2 text-sm ${
                    viewMode === 'cards'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  } rounded-r-md border-l border-gray-300`}
                  onClick={() => setViewMode('cards')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No Room Type Selected */}
      {!selectedRoomTypeId && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
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
            Select a room type
          </h3>
          <p className="mt-2 text-gray-600">
            Choose a room type from the dropdown to view and manage inventory
          </p>
        </div>
      )}

      {/* Error State */}
      {error && selectedRoomTypeId && (
        <div className="mb-6 rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchInventory}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && selectedRoomTypeId && (
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
            <span className="text-gray-600">Loading inventory...</span>
          </div>
        </div>
      )}

      {/* Inventory Content */}
      {!isLoading && !error && selectedRoomTypeId && inventory.length > 0 && (
        <>
          {/* Date Range Info */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {inventory.length} day{inventory.length !== 1 ? 's' : ''}: {getDateRangeText(inventory)}
            </p>
          </div>

          {/* Table or Cards View */}
          <div className={viewMode === 'table' ? 'hidden md:block' : 'md:hidden'}>
            {viewMode === 'table' ? (
              <InventoryTable
                inventory={inventory}
                roomTypeId={selectedRoomTypeId}
                totalRooms={selectedRoomType?.totalRooms || 0}
                onUpdate={fetchInventory}
                onShowToast={showToast}
              />
            ) : (
              <InventoryCards
                inventory={inventory}
                roomTypeId={selectedRoomTypeId}
                totalRooms={selectedRoomType?.totalRooms || 0}
                onUpdate={fetchInventory}
                onShowToast={showToast}
              />
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            {viewMode === 'table' ? (
              <InventoryTable
                inventory={inventory}
                roomTypeId={selectedRoomTypeId}
                totalRooms={selectedRoomType?.totalRooms || 0}
                onUpdate={fetchInventory}
                onShowToast={showToast}
              />
            ) : (
              <InventoryCards
                inventory={inventory}
                roomTypeId={selectedRoomTypeId}
                totalRooms={selectedRoomType?.totalRooms || 0}
                onUpdate={fetchInventory}
                onShowToast={showToast}
              />
            )}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevPage}
              disabled={currentPage === 0}
            >
              <svg
                className="mr-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Previous {ITEMS_PER_PAGE} Days
            </Button>

            <span className="text-sm text-gray-600">
              Page {currentPage + 1}
            </span>

            <Button
              variant="outline"
              onClick={handleNextPage}
              disabled={!hasMore}
            >
              Next {ITEMS_PER_PAGE} Days
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </>
      )}

      {/* Empty State */}
      {!isLoading && !error && selectedRoomTypeId && inventory.length === 0 && (
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
            Create inventory for {selectedRoomType?.name} to get started
          </p>
          <Button onClick={handleOpenBulkModal} className="mt-4">
            Create Inventory
          </Button>
        </div>
      )}

      {/* Bulk Inventory Modal */}
      {selectedRoomType && (
        <BulkInventoryForm
          open={isBulkModalOpen}
          onOpenChange={setIsBulkModalOpen}
          onSuccess={handleBulkSuccess}
          roomTypeId={selectedRoomType.id}
          roomTypeName={selectedRoomType.name}
          totalRooms={selectedRoomType.totalRooms}
        />
      )}

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

export default function AdminInventoryPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminInventoryContent />
    </ProtectedRoute>
  );
}
