'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { fetchAdminBookings } from '@/actions/admin/bookings';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingFilters } from '@/components/admin/BookingFilters';
import type { BookingFilters as BookingFiltersType } from '@/lib/validation/admin.validation';
import { Plus, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ==========================================
// ADMIN BOOKINGS PAGE
// ==========================================

function AdminBookingsContent() {
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Partial<BookingFiltersType>>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const loadBookings = async (currentFilters: Partial<BookingFiltersType> = filters) => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await fetchAdminBookings(currentFilters);

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch bookings');
      }

      setBookings(result.bookings || []);
      setTotal(result.total || 0);
      setPage(result.page || 1);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error('Load bookings error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleFilterChange = (newFilters: Partial<BookingFiltersType>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 };
    setFilters(updatedFilters);
    loadBookings(updatedFilters);
  };

  const handlePageChange = (newPage: number) => {
    const updatedFilters = { ...filters, page: newPage };
    setFilters(updatedFilters);
    loadBookings(updatedFilters);
  };

  const handleRefresh = () => {
    loadBookings(filters);
  };

  const handleReset = () => {
    const defaultFilters: Partial<BookingFiltersType> = {
      page: 1,
      limit: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    loadBookings(defaultFilters);
  };

  const handleNewBooking = () => {
    router.push('/rooms');
  };

  const actions = (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
      <Button variant="outline">
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button onClick={handleNewBooking}>
        <Plus className="h-4 w-4 mr-2" />
        New Booking
      </Button>
    </div>
  );

  return (
    <AdminLayout
      title="Booking Management"
      subtitle={`Manage all hotel bookings and reservations (${total} total bookings)`}
      actions={actions}
    >
      <div className="space-y-6">
        {/* Filters */}
        <BookingFilters
          filters={filters as BookingFiltersType}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          totalCount={total}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading bookings...</p>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Booking #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookings.map((booking: any) => (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                        {booking.bookingNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{booking.user?.name}</div>
                        <div className="text-sm text-gray-500">{booking.user?.email || booking.user?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.roomType?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${(booking.totalPrice / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.paymentStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-800' :
                          booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{page}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && bookings.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600 mb-4">
              {Object.keys(filters).length > 3
                ? 'Try adjusting your filters to see more results'
                : 'Get started by creating your first booking'}
            </p>
            <Button onClick={handleNewBooking}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Booking
            </Button>
          </div>
        )}

        {/* Stats Summary */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Total Bookings</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-2xl font-bold text-green-600">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Provisional</p>
              <p className="text-2xl font-bold text-yellow-600">
                {bookings.filter(b => b.status === 'PROVISIONAL').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-red-600">
                {bookings.filter(b => b.status === 'CANCELLED').length}
              </p>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <AdminBookingsContent />
    </ProtectedRoute>
  );
}