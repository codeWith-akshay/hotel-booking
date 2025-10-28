'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { fetchAdminBookings } from '@/actions/admin/bookings';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingFilters } from '@/components/admin/BookingFilters';
import type { BookingFilters as BookingFiltersType } from '@/lib/validation/admin.validation';
import { 
  Plus, RefreshCw, Download, Calendar, TrendingUp, 
  Users, DollarSign, CheckCircle, Clock, XCircle,
  Filter, Search, BarChart3, Eye, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ==========================================
// ADMIN BOOKINGS PAGE - ENHANCED
// ==========================================

function BookingsContent() {
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
    <div className="flex gap-3">
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="group flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-300 disabled:opacity-50"
      >
        <RefreshCw className={`h-5 w-5 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
        <span className="font-bold text-gray-700">Refresh</span>
      </button>
      <button
        className="group flex items-center gap-2 px-6 py-3 bg-linear-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Download className="h-5 w-5 relative z-10" />
        <span className="font-bold relative z-10">Export</span>
      </button>
      <button
        onClick={handleNewBooking}
        className="group flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Plus className="h-5 w-5 relative z-10" />
        <span className="font-bold relative z-10">New Booking</span>
      </button>
    </div>
  );

  return (
    <AdminLayout
      title="Booking Management"
      subtitle={`Manage all hotel bookings and reservations (${total} total bookings)`}
      actions={actions}
    >
      <div className="space-y-8 relative">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-20 right-20 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob" />
          <div className="absolute top-40 left-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000" />
          <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000" />
        </div>

        {/* Stats Cards - Enhanced */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mb-2">{total}</div>
                <div className="text-sm text-gray-600 font-semibold">Total Bookings</div>
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-green-600 font-bold">+12.5%</span>
                  <span className="text-gray-500">vs last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-linear-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
                    <CheckCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-green-600 mb-2">
                  {bookings.filter(b => b.status === 'CONFIRMED').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Confirmed</div>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(bookings.filter(b => b.status === 'CONFIRMED').length / total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-linear-to-br from-yellow-500 to-orange-600 rounded-2xl shadow-lg">
                    <Clock className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-yellow-600 mb-2">
                  {bookings.filter(b => b.status === 'PROVISIONAL').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Provisional</div>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${(bookings.filter(b => b.status === 'PROVISIONAL').length / total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-4 bg-linear-to-br from-red-500 to-red-600 rounded-2xl shadow-lg">
                    <XCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div className="text-4xl font-extrabold text-red-600 mb-2">
                  {bookings.filter(b => b.status === 'CANCELLED').length}
                </div>
                <div className="text-sm text-gray-600 font-semibold">Cancelled</div>
                <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-linear-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000"
                    style={{ width: `${(bookings.filter(b => b.status === 'CANCELLED').length / total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters - Enhanced */}
        <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 relative z-10">
          <CardHeader className="bg-linear-to-r from-blue-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-extrabold text-gray-900 flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-2xl shadow-lg">
                  <Filter className="h-6 w-6 text-white" />
                </div>
                Search & Filter
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <BookingFilters
              filters={filters as BookingFiltersType}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
              totalCount={total}
            />
          </CardContent>
        </Card>

        {/* Error State - Enhanced */}
        {error && (
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden bg-red-50 relative z-10">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-600 rounded-xl">
                  <XCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">Error Loading Bookings</h3>
                  <p className="text-red-600">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State - Enhanced */}
        {isLoading && (
          <Card className="border-0 shadow-xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 relative z-10">
            <CardContent className="p-16">
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200 animate-ping" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                  </div>
                  <p className="text-lg font-semibold text-gray-700 mb-2">Loading Bookings</p>
                  <p className="text-sm text-gray-500">Fetching latest data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bookings Table - Enhanced */}
        {!isLoading && !error && bookings.length > 0 && (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 relative z-10">
            <CardHeader className="bg-linear-to-r from-indigo-50 via-purple-50 to-pink-50 border-b-2 border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-extrabold text-gray-900 flex items-center gap-3">
                  <div className="p-3 bg-purple-600 rounded-2xl shadow-lg">
                    <BarChart3 className="h-7 w-7 text-white" />
                  </div>
                  Booking Records
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                  <Eye className="h-4 w-4" />
                  Showing {bookings.length} of {total} bookings
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-linear-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Booking #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Room Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Payment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {bookings.map((booking: any, index: number) => (
                      <tr 
                        key={booking.id} 
                        className="hover:bg-linear-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer group"
                        style={{ animation: `fadeIn 0.4s ease-in-out ${index * 0.05}s both` }}
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2">
                            #{booking.bookingNumber}
                            <Sparkles className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg">
                              {booking.user?.name?.charAt(0) || 'G'}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{booking.user?.name}</div>
                              <div className="text-xs text-gray-500">{booking.user?.email || booking.user?.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">{booking.roomType?.name}</span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            <div className="font-medium">
                              {new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                            <div className="text-xs text-gray-500">
                              to {new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <span className="text-base font-extrabold text-gray-900">
                            ${(booking.totalPrice / 100).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                            booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800 border-2 border-green-200' :
                            booking.status === 'PROVISIONAL' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200' :
                            'bg-red-100 text-red-800 border-2 border-red-200'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-center">
                          <span className={`px-3 py-1.5 inline-flex text-xs leading-5 font-bold rounded-full shadow-sm ${
                            booking.paymentStatus === 'SUCCEEDED' ? 'bg-green-100 text-green-800 border-2 border-green-200' :
                            booking.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-200' :
                            'bg-red-100 text-red-800 border-2 border-red-200'
                          }`}>
                            {booking.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            
              {/* Pagination - Enhanced */}
              {totalPages > 1 && (
                <div className="bg-linear-to-r from-gray-50 to-gray-100 px-6 py-4 flex items-center justify-between border-t-2 border-gray-200">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                      className="font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === totalPages}
                      className="font-semibold hover:bg-blue-50 hover:border-blue-400 transition-all duration-200"
                    >
                      Next
                    </Button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Showing page <span className="font-bold text-blue-600">{page}</span> of{' '}
                        <span className="font-bold text-gray-900">{totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-xl shadow-lg -space-x-px">
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 1}
                          className="rounded-l-xl font-bold hover:bg-blue-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={page === totalPages}
                          className="rounded-r-xl font-bold hover:bg-blue-600 hover:text-white transition-all duration-200 disabled:opacity-50"
                        >
                          Next
                        </Button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State - Enhanced */}
        {!isLoading && !error && bookings.length === 0 && (
          <Card className="border-0 shadow-2xl rounded-3xl overflow-hidden backdrop-blur-sm bg-white/90 relative z-10">
            <CardContent className="p-16 text-center">
              <div className="flex flex-col items-center gap-6">
                <div className="p-6 bg-linear-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl">
                  <BarChart3 className="h-16 w-16 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-extrabold text-gray-900">No Bookings Found</h3>
                  <p className="text-base text-gray-600 max-w-md">
                    {Object.keys(filters).length > 3
                      ? 'Try adjusting your filters to see more results.'
                      : 'Get started by creating your first booking.'}
                  </p>
                </div>
                <Button 
                  onClick={handleNewBooking}
                  className="mt-4 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create First Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

export default function AdminBookingsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <BookingsContent />
    </ProtectedRoute>
  );
}