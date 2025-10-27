/**
 * Day 19: Notification Card Component
 * Displays notification with type icon, status badge, and expand/collapse functionality
 */

'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  getNotificationTypeIcon,
  getNotificationTypeLabel,
  getNotificationTypeColor,
  getNotificationStatusColor,
} from '@/lib/utils/notificationUtils';
import type { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import {
  Calendar,
  CreditCard,
  Bell,
  Megaphone,
  CheckCircle,
  XCircle,
  FileText,
  Mail,
  MessageCircle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCheck,
  AlertCircle,
  Ban,
} from 'lucide-react';

// ===========================
// Types
// ===========================

interface NotificationCardProps {
  notification: {
    id: string;
    type: NotificationType;
    channel: NotificationChannel;
    message: string;
    subject?: string | null;
    status: NotificationStatus;
    scheduledAt: Date;
    sentAt?: Date | null;
    errorMessage?: string | null;
    createdAt: Date;
    metadata?: string | null;
  };
  onMarkAsRead?: (notificationId: string) => void;
  onCancel?: (notificationId: string) => void;
  onRetry?: (notificationId: string) => void;
  showActions?: boolean;
}

// ===========================
// Icon Components
// ===========================

const NotificationTypeIcons = {
  BOOKING_REMINDER: Calendar,
  PAYMENT_REMINDER: CreditCard,
  WAITLIST_ALERT: Bell,
  BROADCAST: Megaphone,
  BOOKING_CONFIRMATION: CheckCircle,
  CANCELLATION_NOTICE: XCircle,
  INVOICE_READY: FileText,
};

const ChannelIcons = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
  IN_APP: Bell,
};

const StatusIcons = {
  PENDING: Clock,
  SENT: CheckCheck,
  FAILED: AlertCircle,
  CANCELLED: Ban,
};

// ===========================
// Component
// ===========================

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onCancel,
  onRetry,
  showActions = true,
}: NotificationCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get icon components
  const TypeIcon = NotificationTypeIcons[notification.type];
  const ChannelIcon = ChannelIcons[notification.channel];
  const StatusIcon = StatusIcons[notification.status];

  // Get colors
  const typeColor = getNotificationTypeColor(notification.type);
  const statusColor = getNotificationStatusColor(notification.status);

  // Check if read (from metadata)
  const metadata = notification.metadata ? JSON.parse(notification.metadata) : {};
  const isRead = !!metadata.readAt;

  // Format dates
  const scheduledDate = format(new Date(notification.scheduledAt), 'MMM d, yyyy h:mm a');
  const sentDate = notification.sentAt
    ? format(new Date(notification.sentAt), 'MMM d, yyyy h:mm a')
    : null;

  // Truncate message for preview
  const messagePreview =
    notification.message.length > 100
      ? notification.message.substring(0, 100) + '...'
      : notification.message;

  // Handle mark as read
  const handleMarkAsRead = async () => {
    if (onMarkAsRead && !isRead) {
      setIsLoading(true);
      await onMarkAsRead(notification.id);
      setIsLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (onCancel) {
      setIsLoading(true);
      await onCancel(notification.id);
      setIsLoading(false);
    }
  };

  // Handle retry
  const handleRetry = async () => {
    if (onRetry) {
      setIsLoading(true);
      await onRetry(notification.id);
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-all hover:shadow-md ${
        isRead ? 'bg-white' : 'bg-blue-50 border-blue-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Type Icon */}
        <div className={`shrink-0 p-2 rounded-full ${typeColor.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <TypeIcon className={`w-5 h-5 ${typeColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title Row */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">
                {notification.subject || getNotificationTypeLabel(notification.type)}
              </h3>
              {!isRead && notification.channel === 'IN_APP' && (
                <span className="w-2 h-2 bg-blue-600 rounded-full" title="Unread" />
              )}
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`w-4 h-4 ${statusColor}`} />
              <span className={`text-xs font-medium ${statusColor} capitalize`}>
                {notification.status.toLowerCase()}
              </span>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <ChannelIcon className="w-3.5 h-3.5" />
              <span className="capitalize">{notification.channel.toLowerCase()}</span>
            </div>
            <span>•</span>
            <span title={`Scheduled: ${scheduledDate}`}>
              {sentDate ? `Sent: ${sentDate}` : `Scheduled: ${scheduledDate}`}
            </span>
          </div>

          {/* Message Preview */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {isExpanded ? notification.message : messagePreview}
          </p>

          {/* Error Message */}
          {notification.status === 'FAILED' && notification.errorMessage && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              <span className="font-semibold">Error: </span>
              {notification.errorMessage}
            </div>
          )}

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-3 mt-3">
              {/* Expand/Collapse */}
              {notification.message.length > 100 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                  disabled={isLoading}
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      Show More
                    </>
                  )}
                </button>
              )}

              {/* Mark as Read (IN_APP only) */}
              {!isRead && notification.channel === 'IN_APP' && onMarkAsRead && (
                <button
                  onClick={handleMarkAsRead}
                  className="text-xs text-gray-600 hover:text-gray-800 font-medium"
                  disabled={isLoading}
                >
                  Mark as Read
                </button>
              )}

              {/* Cancel (PENDING only) */}
              {notification.status === 'PENDING' && onCancel && (
                <button
                  onClick={handleCancel}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              )}

              {/* Retry (FAILED only) */}
              {notification.status === 'FAILED' && onRetry && (
                <button
                  onClick={handleRetry}
                  className="text-xs text-amber-600 hover:text-amber-800 font-medium"
                  disabled={isLoading}
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===========================
// Skeleton Loader
// ===========================

export function NotificationCardSkeleton() {
  return (
    <div className="border rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-5 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    </div>
  );
}

// ===========================
// Empty State
// ===========================

export function NotificationCardEmpty() {
  return (
    <div className="text-center py-12">
      <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications</h3>
      <p className="text-sm text-gray-500">
        You don't have any notifications yet. They will appear here when you receive them.
      </p>
    </div>
  );
}
