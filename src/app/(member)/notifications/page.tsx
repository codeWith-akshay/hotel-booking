/**
 * Day 19: Member Notifications Page
 * View all notifications with filters and pagination
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import NotificationCard, {
  NotificationCardSkeleton,
  NotificationCardEmpty,
} from '@/components/notifications/NotificationCard';
import { markNotificationAsRead, cancelNotification, retryFailedNotification } from '@/actions/notifications';
import { Bell, Filter, RefreshCw } from 'lucide-react';
import type { NotificationType, NotificationChannel, NotificationStatus, Notification } from '@prisma/client';

// ===========================
// Types
// ===========================

interface NotificationWithUser extends Notification {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

interface NotificationsResponse {
  success: boolean;
  data?: {
    notifications: NotificationWithUser[];
    total: number;
    page: number;
    totalPages: number;
  };
  error?: string;
}

// ===========================
// Component
// ===========================

export default function NotificationsPage() {
  const { user, isAuthenticated, token } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('');
  const [channelFilter, setChannelFilter] = useState<NotificationChannel | ''>('');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | ''>('');
  const [showFilters, setShowFilters] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.id || !token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (typeFilter) params.append('type', typeFilter);
      if (channelFilter) params.append('channel', channelFilter);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data: NotificationsResponse = await response.json();

      if (data.success && data.data) {
        setNotifications(data.data.notifications);
        setTotal(data.data.total);
        setTotalPages(data.data.totalPages);
      } else {
        setError(data.error || 'Failed to fetch notifications');
      }
    } catch (err) {
      console.error('[NotificationsPage] Error fetching notifications:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount and when filters/page change
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user, page, typeFilter, channelFilter, statusFilter]);

  // Handle mark as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!user?.id) return;

    const result = await markNotificationAsRead({
      notificationId,
      userId: user.id,
    });

    if (result.success) {
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) => {
          if (notif.id === notificationId) {
            const metadata = notif.metadata ? JSON.parse(notif.metadata) : {};
            metadata.readAt = new Date().toISOString();
            return { ...notif, metadata: JSON.stringify(metadata) };
          }
          return notif;
        })
      );
    }
  };

  // Handle cancel
  const handleCancel = async (notificationId: string) => {
    if (!user?.id) return;

    const result = await cancelNotification({
      notificationId,
      requestUserId: user.id,
    });

    if (result.success) {
      // Refresh notifications
      fetchNotifications();
    }
  };

  // Handle retry
  const handleRetry = async (notificationId: string) => {
    if (!user?.id) return;

    const result = await retryFailedNotification({
      notificationId,
      requestUserId: user.id,
    });

    if (result.success) {
      // Refresh notifications
      fetchNotifications();
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setTypeFilter('');
    setChannelFilter('');
    setStatusFilter('');
    setPage(1);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-8 h-8" />
                Notifications
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {total > 0 ? `${total} total notification${total !== 1 ? 's' : ''}` : 'No notifications'}
              </p>
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => {
                      setTypeFilter(e.target.value as NotificationType | '');
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Types</option>
                    <option value="BOOKING_REMINDER">Booking Reminder</option>
                    <option value="PAYMENT_REMINDER">Payment Reminder</option>
                    <option value="WAITLIST_ALERT">Waitlist Alert</option>
                    <option value="BROADCAST">Broadcast</option>
                    <option value="BOOKING_CONFIRMATION">Booking Confirmation</option>
                    <option value="CANCELLATION_NOTICE">Cancellation Notice</option>
                    <option value="INVOICE_READY">Invoice Ready</option>
                  </select>
                </div>

                {/* Channel Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
                  <select
                    value={channelFilter}
                    onChange={(e) => {
                      setChannelFilter(e.target.value as NotificationChannel | '');
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Channels</option>
                    <option value="EMAIL">Email</option>
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                    <option value="IN_APP">In-App</option>
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value as NotificationStatus | '');
                      setPage(1);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="PENDING">Pending</option>
                    <option value="SENT">Sent</option>
                    <option value="FAILED">Failed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  Reset Filters
                </button>
                <button
                  onClick={fetchNotifications}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 5 }).map((_, i) => <NotificationCardSkeleton key={i} />)
          ) : notifications.length === 0 ? (
            // Empty state
            <div className="bg-white border border-gray-200 rounded-lg">
              <NotificationCardEmpty />
            </div>
          ) : (
            // Notification cards
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onCancel={handleCancel}
                onRetry={handleRetry}
                showActions={true}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
