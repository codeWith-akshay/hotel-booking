/**
 * SuperAdmin Redux Slice
 * 
 * Manages state for SuperAdmin operations:
 * - Booking rules (3-2-1 windows)
 * - Deposit policies
 * - Special days calendar
 * - Bulk messaging campaigns
 * 
 * Includes async thunks for server actions and comprehensive selectors
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../store'
import type {
  BookingRule,
  DepositPolicy,
  SpecialDay,
  BulkMessageChannel,
  BulkMessageStatus,
  MessageSendResult,
  CsvRecipient,
} from '@/lib/validation/superadmin.validation'

// ==========================================
// STATE TYPES
// ==========================================

export interface BulkMessageCampaign {
  id: string
  title: string
  messageContent: string
  channel: BulkMessageChannel
  totalRecipients: number
  sentCount: number
  failedCount: number
  status: BulkMessageStatus
  results?: MessageSendResult[]
  createdAt: string
  startedAt?: string
  completedAt?: string
}

export interface SuperAdminState {
  // Booking Rules
  bookingRules: BookingRule[]
  bookingRulesLoading: boolean
  bookingRulesError: string | null

  // Deposit Policies
  depositPolicies: DepositPolicy[]
  depositPoliciesLoading: boolean
  depositPoliciesError: string | null

  // Special Days
  specialDays: SpecialDay[]
  specialDaysLoading: boolean
  specialDaysError: string | null
  selectedDate: Date | null
  selectedSpecialDay: SpecialDay | null

  // Bulk Messaging
  csvRecipients: CsvRecipient[]
  csvErrors: { row: number; errors: string[] }[] | null
  messageTemplate: string
  selectedChannel: BulkMessageChannel
  campaignTitle: string
  
  // Campaign state
  currentCampaign: BulkMessageCampaign | null
  sendProgress: number // 0-100
  isSending: boolean
  sendError: string | null

  // Campaign history
  campaigns: BulkMessageCampaign[]
  campaignsLoading: boolean
  campaignsError: string | null
}

const initialState: SuperAdminState = {
  // Booking Rules
  bookingRules: [],
  bookingRulesLoading: false,
  bookingRulesError: null,

  // Deposit Policies
  depositPolicies: [],
  depositPoliciesLoading: false,
  depositPoliciesError: null,

  // Special Days
  specialDays: [],
  specialDaysLoading: false,
  specialDaysError: null,
  selectedDate: null,
  selectedSpecialDay: null,

  // Bulk Messaging
  csvRecipients: [],
  csvErrors: null,
  messageTemplate: '',
  selectedChannel: 'whatsapp',
  campaignTitle: '',
  
  currentCampaign: null,
  sendProgress: 0,
  isSending: false,
  sendError: null,

  campaigns: [],
  campaignsLoading: false,
  campaignsError: null,
}

// ==========================================
// ASYNC THUNKS
// ==========================================

/**
 * Fetch all booking rules
 */
export const fetchBookingRules = createAsyncThunk(
  'superAdmin/fetchBookingRules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/rules')
      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch booking rules')
      }

      return data.rules as BookingRule[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch booking rules')
    }
  }
)

/**
 * Update booking rules
 */
export const updateBookingRules = createAsyncThunk(
  'superAdmin/updateBookingRules',
  async (params: { rules: BookingRule[]; adminId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update booking rules')
      }

      return data.rules as BookingRule[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to update booking rules')
    }
  }
)

/**
 * Fetch all deposit policies
 */
export const fetchDepositPolicies = createAsyncThunk(
  'superAdmin/fetchDepositPolicies',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/deposit-policies')
      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch deposit policies')
      }

      return data.policies as DepositPolicy[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch deposit policies')
    }
  }
)

/**
 * Update deposit policies
 */
export const updateDepositPolicies = createAsyncThunk(
  'superAdmin/updateDepositPolicies',
  async (params: { policies: DepositPolicy[]; adminId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/deposit-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to update deposit policies')
      }

      return data.policies as DepositPolicy[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to update deposit policies')
    }
  }
)

/**
 * Fetch special days
 */
export const fetchSpecialDays = createAsyncThunk(
  'superAdmin/fetchSpecialDays',
  async (params: {
    startDate?: string
    endDate?: string
    roomTypeId?: string
    ruleType?: string
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.startDate) queryParams.append('startDate', params.startDate)
      if (params.endDate) queryParams.append('endDate', params.endDate)
      if (params.roomTypeId) queryParams.append('roomTypeId', params.roomTypeId)
      if (params.ruleType) queryParams.append('ruleType', params.ruleType)

      const response = await fetch(`/api/superadmin/special-days?${queryParams}`)
      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch special days')
      }

      return data.specialDays as SpecialDay[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch special days')
    }
  }
)

/**
 * Create or update special day
 */
export const upsertSpecialDay = createAsyncThunk(
  'superAdmin/upsertSpecialDay',
  async (params: { specialDay: SpecialDay; adminId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/special-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to save special day')
      }

      return data.specialDay as SpecialDay
    } catch (error) {
      return rejectWithValue('Network error: Failed to save special day')
    }
  }
)

/**
 * Delete special day
 */
export const deleteSpecialDay = createAsyncThunk(
  'superAdmin/deleteSpecialDay',
  async (params: { id: string; adminId: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/superadmin/special-days/${params.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: params.adminId }),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to delete special day')
      }

      return params.id
    } catch (error) {
      return rejectWithValue('Network error: Failed to delete special day')
    }
  }
)

/**
 * Send bulk messages
 */
export const sendBulkMessages = createAsyncThunk(
  'superAdmin/sendBulkMessages',
  async (params: {
    adminId: string
    title: string
    messageContent: string
    channel: BulkMessageChannel
    recipients: CsvRecipient[]
  }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/superadmin/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to send bulk messages')
      }

      return {
        campaignId: data.campaignId,
        totalRecipients: data.totalRecipients,
        sentCount: data.sentCount,
        failedCount: data.failedCount,
        results: data.results,
      }
    } catch (error) {
      return rejectWithValue('Network error: Failed to send bulk messages')
    }
  }
)

/**
 * Fetch bulk message campaigns
 */
export const fetchBulkCampaigns = createAsyncThunk(
  'superAdmin/fetchBulkCampaigns',
  async (params: {
    adminId?: string
    channel?: BulkMessageChannel
    status?: BulkMessageStatus
    page?: number
    limit?: number
  }, { rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams()
      if (params.adminId) queryParams.append('adminId', params.adminId)
      if (params.channel) queryParams.append('channel', params.channel)
      if (params.status) queryParams.append('status', params.status)
      if (params.page) queryParams.append('page', params.page.toString())
      if (params.limit) queryParams.append('limit', params.limit.toString())

      const response = await fetch(`/api/superadmin/bulk-campaigns?${queryParams}`)
      const data = await response.json()

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch campaigns')
      }

      return data.campaigns as BulkMessageCampaign[]
    } catch (error) {
      return rejectWithValue('Network error: Failed to fetch campaigns')
    }
  }
)

// ==========================================
// SLICE
// ==========================================

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState,
  reducers: {
    // CSV Recipients
    setCsvRecipients: (state, action: PayloadAction<CsvRecipient[]>) => {
      state.csvRecipients = action.payload
      state.csvErrors = null
    },
    
    setCsvErrors: (state, action: PayloadAction<{ row: number; errors: string[] }[]>) => {
      state.csvErrors = action.payload
    },
    
    clearCsvData: (state) => {
      state.csvRecipients = []
      state.csvErrors = null
    },

    // Message Template
    setMessageTemplate: (state, action: PayloadAction<string>) => {
      state.messageTemplate = action.payload
    },

    // Campaign Title
    setCampaignTitle: (state, action: PayloadAction<string>) => {
      state.campaignTitle = action.payload
    },

    // Channel Selection
    setSelectedChannel: (state, action: PayloadAction<BulkMessageChannel>) => {
      state.selectedChannel = action.payload
    },

    // Special Day Selection
    setSelectedDate: (state, action: PayloadAction<Date | null>) => {
      state.selectedDate = action.payload
    },

    setSelectedSpecialDay: (state, action: PayloadAction<SpecialDay | null>) => {
      state.selectedSpecialDay = action.payload
    },

    // Clear Errors
    clearBookingRulesError: (state) => {
      state.bookingRulesError = null
    },

    clearDepositPoliciesError: (state) => {
      state.depositPoliciesError = null
    },

    clearSpecialDaysError: (state) => {
      state.specialDaysError = null
    },

    clearSendError: (state) => {
      state.sendError = null
    },

    // Reset bulk message form
    resetBulkMessageForm: (state) => {
      state.csvRecipients = []
      state.csvErrors = null
      state.messageTemplate = ''
      state.campaignTitle = ''
      state.sendProgress = 0
      state.sendError = null
    },
  },
  extraReducers: (builder) => {
    // Fetch Booking Rules
    builder.addCase(fetchBookingRules.pending, (state) => {
      state.bookingRulesLoading = true
      state.bookingRulesError = null
    })
    builder.addCase(fetchBookingRules.fulfilled, (state, action) => {
      state.bookingRulesLoading = false
      state.bookingRules = action.payload
    })
    builder.addCase(fetchBookingRules.rejected, (state, action) => {
      state.bookingRulesLoading = false
      state.bookingRulesError = action.payload as string
    })

    // Update Booking Rules
    builder.addCase(updateBookingRules.pending, (state) => {
      state.bookingRulesLoading = true
      state.bookingRulesError = null
    })
    builder.addCase(updateBookingRules.fulfilled, (state, action) => {
      state.bookingRulesLoading = false
      state.bookingRules = action.payload
    })
    builder.addCase(updateBookingRules.rejected, (state, action) => {
      state.bookingRulesLoading = false
      state.bookingRulesError = action.payload as string
    })

    // Fetch Deposit Policies
    builder.addCase(fetchDepositPolicies.pending, (state) => {
      state.depositPoliciesLoading = true
      state.depositPoliciesError = null
    })
    builder.addCase(fetchDepositPolicies.fulfilled, (state, action) => {
      state.depositPoliciesLoading = false
      state.depositPolicies = action.payload
    })
    builder.addCase(fetchDepositPolicies.rejected, (state, action) => {
      state.depositPoliciesLoading = false
      state.depositPoliciesError = action.payload as string
    })

    // Update Deposit Policies
    builder.addCase(updateDepositPolicies.pending, (state) => {
      state.depositPoliciesLoading = true
      state.depositPoliciesError = null
    })
    builder.addCase(updateDepositPolicies.fulfilled, (state, action) => {
      state.depositPoliciesLoading = false
      state.depositPolicies = action.payload
    })
    builder.addCase(updateDepositPolicies.rejected, (state, action) => {
      state.depositPoliciesLoading = false
      state.depositPoliciesError = action.payload as string
    })

    // Fetch Special Days
    builder.addCase(fetchSpecialDays.pending, (state) => {
      state.specialDaysLoading = true
      state.specialDaysError = null
    })
    builder.addCase(fetchSpecialDays.fulfilled, (state, action) => {
      state.specialDaysLoading = false
      state.specialDays = action.payload
    })
    builder.addCase(fetchSpecialDays.rejected, (state, action) => {
      state.specialDaysLoading = false
      state.specialDaysError = action.payload as string
    })

    // Upsert Special Day
    builder.addCase(upsertSpecialDay.pending, (state) => {
      state.specialDaysLoading = true
      state.specialDaysError = null
    })
    builder.addCase(upsertSpecialDay.fulfilled, (state, action) => {
      state.specialDaysLoading = false
      
      // Update or add special day
      const index = state.specialDays.findIndex(sd => sd.id === action.payload.id)
      if (index !== -1) {
        state.specialDays[index] = action.payload
      } else {
        state.specialDays.push(action.payload)
      }
      
      state.selectedSpecialDay = null
    })
    builder.addCase(upsertSpecialDay.rejected, (state, action) => {
      state.specialDaysLoading = false
      state.specialDaysError = action.payload as string
    })

    // Delete Special Day
    builder.addCase(deleteSpecialDay.pending, (state) => {
      state.specialDaysLoading = true
      state.specialDaysError = null
    })
    builder.addCase(deleteSpecialDay.fulfilled, (state, action) => {
      state.specialDaysLoading = false
      state.specialDays = state.specialDays.filter(sd => sd.id !== action.payload)
      state.selectedSpecialDay = null
    })
    builder.addCase(deleteSpecialDay.rejected, (state, action) => {
      state.specialDaysLoading = false
      state.specialDaysError = action.payload as string
    })

    // Send Bulk Messages
    builder.addCase(sendBulkMessages.pending, (state) => {
      state.isSending = true
      state.sendProgress = 0
      state.sendError = null
    })
    builder.addCase(sendBulkMessages.fulfilled, (state, action) => {
      state.isSending = false
      state.sendProgress = 100
      
      state.currentCampaign = {
        id: action.payload.campaignId,
        title: state.campaignTitle,
        messageContent: state.messageTemplate,
        channel: state.selectedChannel,
        totalRecipients: action.payload.totalRecipients,
        sentCount: action.payload.sentCount,
        failedCount: action.payload.failedCount,
        status: 'completed',
        results: action.payload.results,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }
    })
    builder.addCase(sendBulkMessages.rejected, (state, action) => {
      state.isSending = false
      state.sendProgress = 0
      state.sendError = action.payload as string
    })

    // Fetch Bulk Campaigns
    builder.addCase(fetchBulkCampaigns.pending, (state) => {
      state.campaignsLoading = true
      state.campaignsError = null
    })
    builder.addCase(fetchBulkCampaigns.fulfilled, (state, action) => {
      state.campaignsLoading = false
      state.campaigns = action.payload
    })
    builder.addCase(fetchBulkCampaigns.rejected, (state, action) => {
      state.campaignsLoading = false
      state.campaignsError = action.payload as string
    })
  },
})

// ==========================================
// ACTIONS
// ==========================================

export const {
  setCsvRecipients,
  setCsvErrors,
  clearCsvData,
  setMessageTemplate,
  setCampaignTitle,
  setSelectedChannel,
  setSelectedDate,
  setSelectedSpecialDay,
  clearBookingRulesError,
  clearDepositPoliciesError,
  clearSpecialDaysError,
  clearSendError,
  resetBulkMessageForm,
} = superAdminSlice.actions

// ==========================================
// SELECTORS
// ==========================================

// Booking Rules
export const selectBookingRules = (state: RootState) => state.superAdmin.bookingRules
export const selectBookingRulesLoading = (state: RootState) => state.superAdmin.bookingRulesLoading
export const selectBookingRulesError = (state: RootState) => state.superAdmin.bookingRulesError

// Deposit Policies
export const selectDepositPolicies = (state: RootState) => state.superAdmin.depositPolicies
export const selectActiveDepositPolicies = (state: RootState) => 
  state.superAdmin.depositPolicies.filter(p => p.active)
export const selectDepositPoliciesLoading = (state: RootState) => state.superAdmin.depositPoliciesLoading
export const selectDepositPoliciesError = (state: RootState) => state.superAdmin.depositPoliciesError

// Special Days
export const selectSpecialDays = (state: RootState) => state.superAdmin.specialDays
export const selectActiveSpecialDays = (state: RootState) => 
  state.superAdmin.specialDays.filter(sd => sd.active)
export const selectSelectedDate = (state: RootState) => state.superAdmin.selectedDate
export const selectSelectedSpecialDay = (state: RootState) => state.superAdmin.selectedSpecialDay
export const selectSpecialDaysLoading = (state: RootState) => state.superAdmin.specialDaysLoading
export const selectSpecialDaysError = (state: RootState) => state.superAdmin.specialDaysError

// Bulk Messaging
export const selectCsvRecipients = (state: RootState) => state.superAdmin.csvRecipients
export const selectCsvErrors = (state: RootState) => state.superAdmin.csvErrors
export const selectMessageTemplate = (state: RootState) => state.superAdmin.messageTemplate
export const selectCampaignTitle = (state: RootState) => state.superAdmin.campaignTitle
export const selectSelectedChannel = (state: RootState) => state.superAdmin.selectedChannel
export const selectIsSending = (state: RootState) => state.superAdmin.isSending
export const selectSendProgress = (state: RootState) => state.superAdmin.sendProgress
export const selectSendError = (state: RootState) => state.superAdmin.sendError
export const selectCurrentCampaign = (state: RootState) => state.superAdmin.currentCampaign

// Campaigns
export const selectCampaigns = (state: RootState) => state.superAdmin.campaigns
export const selectCampaignsLoading = (state: RootState) => state.superAdmin.campaignsLoading
export const selectCampaignsError = (state: RootState) => state.superAdmin.campaignsError

// Derived selectors
export const selectCsvStats = (state: RootState) => ({
  total: state.superAdmin.csvRecipients.length,
  valid: state.superAdmin.csvRecipients.length,
  invalid: state.superAdmin.csvErrors?.length || 0,
  hasErrors: (state.superAdmin.csvErrors?.length || 0) > 0,
})

export const selectCanSendMessages = (state: RootState) => {
  const hasTemplate = state.superAdmin.messageTemplate.length >= 10
  const hasTitle = state.superAdmin.campaignTitle.length >= 3
  const notSending = !state.superAdmin.isSending
  
  return hasTemplate && hasTitle && notSending
}

export default superAdminSlice.reducer
