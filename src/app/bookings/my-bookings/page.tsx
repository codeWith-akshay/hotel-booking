'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { getUserBookings } from '@/actions/bookings/booking.action'
import type { BookingSummary } from '@/types/prisma-booking.types'
import BookingsTable, { type BookingTableData } from '@/components/bookings/BookingsTable'
import { toast } from 'sonner'

export default function MyBookingsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [bookings, setBookings] = useState<BookingTableData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadBookings() {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const result = await getUserBookings({
          userId: user.id,
          page: 1,
          pageSize: 50,
        })

        if (result.success && result.data?.bookings) {
          // Transform BookingSummary to BookingTableData
          const transformedBookings: BookingTableData[] = result.data.bookings.map((booking: BookingSummary) => ({
            id: booking.id,
            bookingId: booking.bookingId || booking.id, // Fallback to id if bookingId is undefined
            roomTypeName: booking.roomTypeName,
            roomNumber: booking.roomNumber || undefined,
            userName: booking.userName,
            userEmail: user.email || undefined,
            startDate: booking.startDate,
            endDate: booking.endDate,
            nights: booking.nights,
            totalPrice: booking.totalPrice,
            status: booking.status,
            createdAt: booking.createdAt,
          }))
          setBookings(transformedBookings)
        } else {
          toast.error(result.error || 'Failed to load bookings')
        }
      } catch (error) {
        console.error('Error fetching bookings:', error)
        toast.error('An error occurred while loading bookings')
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [user?.id, user?.email])

  const handleViewDetails = (bookingId: string) => {
    // Navigate to booking details page or open modal
    router.push(`/bookings/${bookingId}`)
  }

  const handleRecordPayment = (bookingId: string) => {
    // Navigate to payment page or open payment modal
    router.push(`/bookings/${bookingId}/payment`)
  }

  return (
    <ProtectedRoute>
      <BookingsTable
        bookings={bookings}
        loading={loading}
        onViewDetails={handleViewDetails}
        onRecordPayment={handleRecordPayment}
        showActions={true}
        showSearch={true}
        showFilters={true}
        title="My Bookings"
        description="View and manage your hotel reservations"
        emptyMessage="No bookings yet"
        emptyAction={{
          label: 'Browse Rooms',
          onClick: () => router.push('/rooms')
        }}
      />
    </ProtectedRoute>
  )
}
