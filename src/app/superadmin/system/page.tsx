'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import Layout from '@/components/layout/Layout'
import Header from '@/components/layout/Header'
import { useAuthStore } from '@/store/auth.store'

/**
 * SuperAdmin System Settings Page
 * 
 * Provides system-wide configuration and settings management
 * Features: Environment variables, API configuration, system health, maintenance mode
 */

interface SystemConfig {
  maintenance: {
    enabled: boolean
    message: string
    allowedRoles: string[]
  }
  booking: {
    maxAdvanceDays: number
    minNoticeDays: number
    maxRoomsPerBooking: number
  }
  email: {
    enabled: boolean
    provider: string
    fromAddress: string
  }
  payment: {
    enabled: boolean
    provider: string
    testMode: boolean
  }
  api: {
    ircaEnabled: boolean
    rateLimitPerMinute: number
    timeout: number
  }
}

const defaultConfig: SystemConfig = {
  maintenance: {
    enabled: false,
    message: 'System is under maintenance. Please check back later.',
    allowedRoles: ['SUPERADMIN', 'ADMIN'],
  },
  booking: {
    maxAdvanceDays: 90,
    minNoticeDays: 1,
    maxRoomsPerBooking: 5,
  },
  email: {
    enabled: true,
    provider: 'SMTP',
    fromAddress: 'noreply@hotel.com',
  },
  payment: {
    enabled: true,
    provider: 'Stripe',
    testMode: false,
  },
  api: {
    ircaEnabled: true,
    rateLimitPerMinute: 60,
    timeout: 10000,
  },
}

export default function SystemSettingsPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [config, setConfig] = useState<SystemConfig>(defaultConfig)
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

  // Check authentication and role
  useEffect(() => {
    if (!isAuthenticated || !user || user.role !== 'SUPERADMIN') {
      router.push('/login')
    }
  }, [isAuthenticated, user, router])

  const handleLogout = () => {
    router.push('/logout')
  }

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      // TODO: Implement API call to save system config
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  const handleReset = () => {
    if (confirm('Reset all settings to default values?')) {
      setConfig(defaultConfig)
    }
  }

  if (!isAuthenticated || user?.role !== 'SUPERADMIN') {
    return null
  }

  return (
    <>
      <Header
        user={{
          name: user?.name || 'SuperAdmin',
          email: user?.email || user?.phone || '',
          role: user?.role || 'SUPERADMIN',
        }}
        onLogout={handleLogout}
        showNotifications={true}
        notificationsCount={0}
        onNotificationClick={() => router.push('/superadmin/notifications')}
        showSidebarToggle={false}
      />
      
      <Layout
        user={{
          name: user?.name || 'SuperAdmin',
          email: user?.email || user?.phone || '',
          role: user?.role || 'SUPERADMIN',
        }}
        onLogout={handleLogout}
        config={{ showHeader: false }}
      >
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
              <p className="text-gray-600 mt-1">
                Configure system-wide settings and parameters
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              ← Back
            </button>
          </div>

        {/* Save Status Banner */}
        {saveStatus === 'success' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium">✓ Settings saved successfully</p>
          </div>
        )}
        {saveStatus === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">✗ Failed to save settings</p>
          </div>
        )}

        {/* Maintenance Mode Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🚧 Maintenance Mode
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Maintenance Mode</label>
                <p className="text-sm text-gray-500">Temporarily disable system access for maintenance</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, enabled: !prev.maintenance.enabled }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.maintenance.enabled ? 'bg-red-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.maintenance.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">Maintenance Message</label>
              <textarea
                value={config.maintenance.message}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  maintenance: { ...prev.maintenance, message: e.target.value }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={3}
              />
            </div>
          </div>
        </div>

        {/* Booking Settings Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📅 Booking Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Max Advance Days
              </label>
              <input
                type="number"
                value={config.booking.maxAdvanceDays}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  booking: { ...prev.booking, maxAdvanceDays: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">Days in advance users can book</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Min Notice Days
              </label>
              <input
                type="number"
                value={config.booking.minNoticeDays}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  booking: { ...prev.booking, minNoticeDays: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">Minimum days before check-in</p>
            </div>
            <div>
              <label className="block font-medium text-gray-700 mb-2">
                Max Rooms Per Booking
              </label>
              <input
                type="number"
                value={config.booking.maxRoomsPerBooking}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  booking: { ...prev.booking, maxRoomsPerBooking: parseInt(e.target.value) || 0 }
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-sm text-gray-500 mt-1">Maximum rooms in one booking</p>
            </div>
          </div>
        </div>

        {/* Email Configuration Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            📧 Email Configuration
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Email Notifications</label>
                <p className="text-sm text-gray-500">Send booking confirmations and updates</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  email: { ...prev.email, enabled: !prev.email.enabled }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.email.enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.email.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Email Provider</label>
                <select
                  value={config.email.provider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    email: { ...prev.email, provider: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="SMTP">SMTP</option>
                  <option value="SendGrid">SendGrid</option>
                  <option value="AWS SES">AWS SES</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">From Address</label>
                <input
                  type="email"
                  value={config.email.fromAddress}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    email: { ...prev.email, fromAddress: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Configuration Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💳 Payment Configuration
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">Enable Online Payments</label>
                <p className="text-sm text-gray-500">Accept credit card payments</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  payment: { ...prev.payment, enabled: !prev.payment.enabled }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.payment.enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.payment.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">Payment Provider</label>
                <select
                  value={config.payment.provider}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    payment: { ...prev.payment, provider: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Stripe">Stripe</option>
                  <option value="Razorpay">Razorpay</option>
                  <option value="PayPal">PayPal</option>
                </select>
              </div>
              <div className="flex items-center">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.payment.testMode}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      payment: { ...prev.payment, testMode: e.target.checked }
                    }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <span className="font-medium text-gray-700">Test Mode</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* API Configuration Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            🔌 API Configuration
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-700">IRCA Membership API</label>
                <p className="text-sm text-gray-500">Verify IRCA membership status</p>
              </div>
              <button
                onClick={() => setConfig(prev => ({
                  ...prev,
                  api: { ...prev.api, ircaEnabled: !prev.api.ircaEnabled }
                }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  config.api.ircaEnabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    config.api.ircaEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Rate Limit (per minute)
                </label>
                <input
                  type="number"
                  value={config.api.rateLimitPerMinute}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    api: { ...prev.api, rateLimitPerMinute: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block font-medium text-gray-700 mb-2">
                  Timeout (ms)
                </label>
                <input
                  type="number"
                  value={config.api.timeout}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    api: { ...prev.api, timeout: parseInt(e.target.value) || 0 }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === 'saving' ? 'Saving...' : '💾 Save Settings'}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            🔄 Reset to Defaults
          </button>
        </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Changes to system settings require careful consideration as they affect all users. 
              Some settings may require server restart to take effect.
            </p>
          </div>
        </div>
      </Layout>
    </>
  )
}
