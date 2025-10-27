'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { broadcastNotification } from '@/actions/notifications';
import { Megaphone, Send, Calendar, Users, CheckCircle, AlertCircle } from 'lucide-react';
import type { NotificationChannel, Role } from '@prisma/client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { useAuthStore } from '@/store/auth.store';

// ===========================
// Component
// ===========================

function BroadcastContent() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [channel, setChannel] = useState<NotificationChannel>('EMAIL');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [filterByRole, setFilterByRole] = useState<'MEMBER' | 'ADMIN' | 'SUPERADMIN' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    notifications: number;
    succeeded: number;
    failed: number;
  } | null>(null);

  // Character counts
  const messageLength = message.length;
  const maxLength = {
    EMAIL: 10000,
    WHATSAPP: 4096,
    SMS: 160,
    IN_APP: 1000,
  }[channel];

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await broadcastNotification({
        adminId: user.id,
        channel,
        message,
        subject: subject.trim() || undefined,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
        filterByRole: filterByRole || undefined,
      });

      if (result.success && result.data) {
        setSuccess({
          notifications: result.data.notifications.length,
          succeeded: result.data.successCount,
          failed: result.data.failureCount,
        });

        // Reset form
        setSubject('');
        setMessage('');
        setScheduledAt('');
        setFilterByRole('');
      } else {
        setError(result.error || 'Failed to send broadcast');
      }
    } catch (err) {
      console.error('[BroadcastPage] Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="Broadcast Notifications"
      subtitle="Send bulk notifications to users (SuperAdmin only)"
      actions={
        <button
          onClick={handleSubmit}
          disabled={isLoading || !message.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {isLoading ? 'Sending...' : 'Send Broadcast'}
        </button>
      }
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Megaphone className="w-8 h-8" />
            Broadcast Notification
          </h1>
          <p className="text-gray-600">Send bulk notifications to all users or specific roles</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900">Broadcast Sent Successfully!</h3>
                <p className="mt-1 text-sm text-green-700">
                  Created {success.notifications} notification{success.notifications !== 1 ? 's' : ''}
                  {success.succeeded > 0 &&
                    ` • ${success.succeeded} sent immediately`}
                  {success.failed > 0 && ` • ${success.failed} failed`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          {/* Channel Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Channel <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['EMAIL', 'WHATSAPP', 'SMS', 'IN_APP'] as NotificationChannel[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`px-4 py-3 border rounded-lg text-sm font-medium transition ${
                    channel === ch
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {ch.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Subject (Email only) */}
          {channel === 'EMAIL' && (
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={200}
              />
            </div>
          )}

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span
                className={`text-xs ${
                  messageLength > maxLength ? 'text-red-600 font-semibold' : 'text-gray-500'
                }`}
              >
                {messageLength} / {maxLength}
              </span>
            </div>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message..."
              rows={8}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              maxLength={maxLength}
            />
            <p className="mt-1 text-xs text-gray-500">
              {channel === 'EMAIL'
                ? 'Supports plain text and will be formatted in HTML template'
                : channel === 'WHATSAPP'
                ? 'Supports emojis and line breaks'
                : channel === 'SMS'
                ? 'Keep it short and concise (max 160 characters)'
                : 'Will appear in user dashboard'}
            </p>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Target Audience
            </label>
            <select
              value={typeof filterByRole === 'string' ? filterByRole : ''}
              onChange={(e) => setFilterByRole(e.target.value as 'MEMBER' | 'ADMIN' | 'SUPERADMIN' | '')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Users</option>
              <option value="MEMBER">Members Only</option>
              <option value="ADMIN">Admins Only</option>
              <option value="SUPERADMIN">SuperAdmins Only</option>
            </select>
          </div>

          {/* Schedule */}
          <div>
            <label htmlFor="scheduledAt" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Schedule for Later (Optional)
            </label>
            <input
              type="datetime-local"
              id="scheduledAt"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave empty to send immediately
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !message.trim() || messageLength > maxLength}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {scheduledAt ? 'Schedule Broadcast' : 'Send Broadcast'}
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
          <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
            <li>Notifications will be created for all matching users</li>
            <li>If scheduled, they will be sent at the specified time</li>
            <li>Failed notifications can be retried later from the notifications page</li>
            <li>Users with missing contact info (email/phone) will not receive notifications</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

export default function BroadcastPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN', 'SUPERADMIN']}>
      <BroadcastContent />
    </ProtectedRoute>
  );
}
