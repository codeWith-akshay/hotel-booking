/**
 * BookingRulesForm Component
 * 
 * Form for managing booking rules and deposit policies:
 * - 3-2-1 rule windows (booking window based on guest type)
 * - Group booking deposit thresholds
 * 
 * Features:
 * - Real-time validation
 * - Visual feedback for rule constraints
 * - Tabbed interface for rules vs policies
 */

'use client'

import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import {
  fetchBookingRules,
  updateBookingRules,
  fetchDepositPolicies,
  updateDepositPolicies,
  selectBookingRules,
  selectBookingRulesLoading,
  selectBookingRulesError,
  selectDepositPolicies,
  selectDepositPoliciesLoading,
  selectDepositPoliciesError,
  clearBookingRulesError,
  clearDepositPoliciesError,
} from '@/redux/slices/superAdminSlice'
import {
  BookingRule,
  DepositPolicy,
  GuestType,
  DepositType,
} from '@/lib/validation/superadmin.validation'
import { Settings, DollarSign, Save, AlertCircle, CheckCircle2, Info } from 'lucide-react'

interface BookingRulesFormProps {
  adminId: string
  onSuccess?: () => void
}

export default function BookingRulesForm({ adminId, onSuccess }: BookingRulesFormProps) {
  const dispatch = useAppDispatch()

  const bookingRules = useAppSelector(selectBookingRules)
  const bookingRulesLoading = useAppSelector(selectBookingRulesLoading)
  const bookingRulesError = useAppSelector(selectBookingRulesError)

  const depositPolicies = useAppSelector(selectDepositPolicies)
  const depositPoliciesLoading = useAppSelector(selectDepositPoliciesLoading)
  const depositPoliciesError = useAppSelector(selectDepositPoliciesError)

  const [activeTab, setActiveTab] = useState<'rules' | 'deposits'>('rules')
  const [editedRules, setEditedRules] = useState<BookingRule[]>([])
  const [editedPolicies, setEditedPolicies] = useState<DepositPolicy[]>([])
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Load data on mount
  useEffect(() => {
    dispatch(fetchBookingRules())
    dispatch(fetchDepositPolicies())
  }, [dispatch])

  // Initialize edited states
  useEffect(() => {
    if (bookingRules.length > 0 && editedRules.length === 0) {
      setEditedRules(bookingRules)
    }
  }, [bookingRules])

  useEffect(() => {
    if (depositPolicies.length > 0 && editedPolicies.length === 0) {
      setEditedPolicies(depositPolicies)
    }
  }, [depositPolicies])

  // Handle booking rule change
  const handleRuleChange = (guestType: GuestType, field: keyof BookingRule, value: number) => {
    setEditedRules(prev =>
      prev.map(rule =>
        rule.guestType === guestType ? { ...rule, [field]: value } : rule
      )
    )
  }

  // Handle deposit policy change
  const handlePolicyChange = (index: number, field: keyof DepositPolicy, value: any) => {
    setEditedPolicies(prev =>
      prev.map((policy, i) => (i === index ? { ...policy, [field]: value } : policy))
    )
  }

  // Add new deposit policy
  const addPolicy = () => {
    const lastPolicy = editedPolicies[editedPolicies.length - 1]
    const newMinRooms = lastPolicy ? lastPolicy.maxRooms + 1 : 2

    setEditedPolicies(prev => [
      ...prev,
      {
        minRooms: newMinRooms,
        maxRooms: newMinRooms + 9,
        type: 'percent',
        value: 20,
        active: true,
      },
    ])
  }

  // Remove deposit policy
  const removePolicy = (index: number) => {
    setEditedPolicies(prev => prev.filter((_, i) => i !== index))
  }

  // Save booking rules
  const handleSaveRules = async () => {
    dispatch(clearBookingRulesError())
    setSuccessMessage(null)

    const result = await dispatch(updateBookingRules({ rules: editedRules, adminId }))

    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Booking rules updated successfully!')
      onSuccess?.()
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  // Save deposit policies
  const handleSavePolicies = async () => {
    dispatch(clearDepositPoliciesError())
    setSuccessMessage(null)

    const result = await dispatch(updateDepositPolicies({ policies: editedPolicies, adminId }))

    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Deposit policies updated successfully!')
      onSuccess?.()
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 p-6 text-white">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Booking Configuration</h2>
            <p className="text-purple-100">Manage rules and deposit policies</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'rules'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Booking Rules (3-2-1 Windows)</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'deposits'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Deposit Policies</span>
            </div>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="m-6 mb-0 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Error Messages */}
      {bookingRulesError && activeTab === 'rules' && (
        <div className="m-6 mb-0 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-red-800">{bookingRulesError}</span>
        </div>
      )}

      {depositPoliciesError && activeTab === 'deposits' && (
        <div className="m-6 mb-0 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="text-red-800">{depositPoliciesError}</span>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {activeTab === 'rules' ? (
          <BookingRulesTab
            rules={editedRules}
            loading={bookingRulesLoading}
            onRuleChange={handleRuleChange}
            onSave={handleSaveRules}
          />
        ) : (
          <DepositPoliciesTab
            policies={editedPolicies}
            loading={depositPoliciesLoading}
            onPolicyChange={handlePolicyChange}
            onAddPolicy={addPolicy}
            onRemovePolicy={removePolicy}
            onSave={handleSavePolicies}
          />
        )}
      </div>
    </div>
  )
}

// ==========================================
// BOOKING RULES TAB
// ==========================================

interface BookingRulesTabProps {
  rules: BookingRule[]
  loading: boolean
  onRuleChange: (guestType: GuestType, field: keyof BookingRule, value: number) => void
  onSave: () => void
}

function BookingRulesTab({ rules, loading, onRuleChange, onSave }: BookingRulesTabProps) {
  const guestTypes: GuestType[] = ['REGULAR', 'VIP', 'CORPORATE']

  const getRule = (guestType: GuestType) => rules.find(r => r.guestType === guestType)

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">3-2-1 Rule Configuration</p>
          <p>
            Configure booking windows for different guest types. Max Days Advance determines how far
            in advance guests can book. Min Days Notice sets the minimum notice required before
            check-in.
          </p>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {guestTypes.map((guestType) => {
          const rule = getRule(guestType)
          if (!rule) return null

          return (
            <div
              key={guestType}
              className="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors"
            >
              {/* Guest Type Header */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{guestType}</h3>
                <p className="text-sm text-gray-600">
                  {guestType === 'REGULAR' && 'Standard guests'}
                  {guestType === 'VIP' && 'Priority guests with relaxed rules'}
                  {guestType === 'CORPORATE' && 'Business guests'}
                </p>
              </div>

              {/* Max Days Advance */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Days Advance
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="730"
                    value={rule.maxDaysAdvance}
                    onChange={(e) =>
                      onRuleChange(guestType, 'maxDaysAdvance', parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">days</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">How far in advance can book</p>
              </div>

              {/* Min Days Notice */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Days Notice
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={rule.minDaysNotice}
                    onChange={(e) =>
                      onRuleChange(guestType, 'minDaysNotice', parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-2.5 text-sm text-gray-500">days</span>
                </div>
                <p className="mt-1 text-xs text-gray-600">Minimum notice required</p>
              </div>

              {/* Validation Error */}
              {rule.minDaysNotice > rule.maxDaysAdvance && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                  Min notice cannot exceed max advance
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Booking Rules'}
        </button>
      </div>
    </div>
  )
}

// ==========================================
// DEPOSIT POLICIES TAB
// ==========================================

interface DepositPoliciesTabProps {
  policies: DepositPolicy[]
  loading: boolean
  onPolicyChange: (index: number, field: keyof DepositPolicy, value: any) => void
  onAddPolicy: () => void
  onRemovePolicy: (index: number) => void
  onSave: () => void
}

function DepositPoliciesTab({
  policies,
  loading,
  onPolicyChange,
  onAddPolicy,
  onRemovePolicy,
  onSave,
}: DepositPoliciesTabProps) {
  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Group Booking Deposit Policies</p>
          <p>
            Configure deposit requirements based on number of rooms booked. Deposits can be a
            percentage of total price or a fixed amount. Policies must not have overlapping room
            ranges.
          </p>
        </div>
      </div>

      {/* Policies List */}
      <div className="space-y-4">
        {policies.map((policy, index) => (
          <div
            key={index}
            className="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors"
          >
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Min Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Rooms</label>
                <input
                  type="number"
                  min="2"
                  value={policy.minRooms}
                  onChange={(e) =>
                    onPolicyChange(index, 'minRooms', parseInt(e.target.value) || 2)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Max Rooms */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Rooms</label>
                <input
                  type="number"
                  min="2"
                  value={policy.maxRooms}
                  onChange={(e) =>
                    onPolicyChange(index, 'maxRooms', parseInt(e.target.value) || 2)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={policy.type}
                  onChange={(e) => onPolicyChange(index, 'type', e.target.value as DepositType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="percent">Percent</option>
                  <option value="fixed">Fixed</option>
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {policy.type === 'percent' ? 'Percent (%)' : 'Amount ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  max={policy.type === 'percent' ? '100' : undefined}
                  step={policy.type === 'percent' ? '1' : '0.01'}
                  value={policy.value}
                  onChange={(e) => onPolicyChange(index, 'value', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Actions */}
              <div className="flex items-end gap-2">
                <button
                  onClick={() => onRemovePolicy(index)}
                  className="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input
                type="text"
                value={policy.description || ''}
                onChange={(e) => onPolicyChange(index, 'description', e.target.value)}
                placeholder="e.g., 10-19 rooms require 20% deposit"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Validation Error */}
            {policy.maxRooms < policy.minRooms && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                Max rooms must be greater than or equal to min rooms
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Policy Button */}
      <button
        onClick={onAddPolicy}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors font-medium"
      >
        + Add Deposit Policy
      </button>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Deposit Policies'}
        </button>
      </div>
    </div>
  )
}
