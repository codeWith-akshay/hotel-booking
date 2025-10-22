// ==========================================
// PROFILE STORE (ZUSTAND)
// ==========================================
// Global state management for user profile and IRCA membership
// Production-ready with TypeScript, async actions, and error handling

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ProfileData, IRCAMembershipData } from '@/lib/validation/profile.schemas'
import {
  getProfileAction,
  updateProfileAction,
  getCurrentMembershipAction,
  checkIRCAMembershipAction,
  updateIRCAMembershipAction,
} from '@/actions/profile/profile.action'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ProfileState {
  // State
  profile: ProfileData | null
  membership: IRCAMembershipData | null
  isLoading: boolean
  isUpdating: boolean
  isMembershipLoading: boolean
  error: string | null
  successMessage: string | null

  // Profile Actions
  fetchProfile: () => Promise<void>
  updateProfile: (data: Partial<ProfileData>) => Promise<boolean>
  clearProfile: () => void

  // Membership Actions
  fetchMembership: () => Promise<void>
  checkMembership: (membershipId: string) => Promise<IRCAMembershipData | null>
  linkMembership: (membershipId: string) => Promise<boolean>
  unlinkMembership: () => Promise<boolean>

  // UI Actions
  setError: (error: string | null) => void
  setSuccess: (message: string | null) => void
  clearMessages: () => void
}

// ==========================================
// ZUSTAND STORE
// ==========================================

/**
 * Profile Store
 * Manages user profile and IRCA membership state
 * 
 * @example
 * ```tsx
 * function ProfilePage() {
 *   const { profile, fetchProfile, isLoading } = useProfileStore()
 *   
 *   useEffect(() => {
 *     fetchProfile()
 *   }, [fetchProfile])
 *   
 *   if (isLoading) return <div>Loading...</div>
 *   return <div>{profile?.name}</div>
 * }
 * ```
 */
export const useProfileStore = create<ProfileState>()(
  devtools(
    (set, get) => ({
      // ==========================================
      // INITIAL STATE
      // ==========================================

      profile: null,
      membership: null,
      isLoading: false,
      isUpdating: false,
      isMembershipLoading: false,
      error: null,
      successMessage: null,

      // ==========================================
      // PROFILE ACTIONS
      // ==========================================

      /**
       * Fetch user profile from server
       * Updates profile state on success
       */
      fetchProfile: async () => {
        set({ isLoading: true, error: null })

        try {
          const result = await getProfileAction()

          if (result.success && result.data) {
            const profileData = result.data as ProfileData
            set({
              profile: profileData,
              isLoading: false,
              error: null,
            })

            // Automatically fetch membership if linked
            if (profileData.ircaMembershipId) {
              get().fetchMembership()
            }
          } else {
            set({
              profile: null,
              isLoading: false,
              error: result.message || 'Failed to fetch profile',
            })
          }
        } catch (error) {
          console.error('[Profile Store] Error fetching profile:', error)
          set({
            profile: null,
            isLoading: false,
            error: 'An unexpected error occurred',
          })
        }
      },

      /**
       * Update user profile
       * Returns true on success, false on failure
       * 
       * @param {Partial<ProfileData>} data - Profile update data
       * @returns {Promise<boolean>} Success status
       */
      updateProfile: async (data: Partial<ProfileData>) => {
        set({ isUpdating: true, error: null, successMessage: null })

        try {
          const result = await updateProfileAction({
            name: data.name!,
            email: data.email,
            phone: data.phone!,
          })

          if (result.success && result.data) {
            set({
              profile: result.data as ProfileData,
              isUpdating: false,
              successMessage: result.message || 'Profile updated successfully',
              error: null,
            })
            return true
          } else {
            set({
              isUpdating: false,
              error: result.message || 'Failed to update profile',
              successMessage: null,
            })
            return false
          }
        } catch (error) {
          console.error('[Profile Store] Error updating profile:', error)
          set({
            isUpdating: false,
            error: 'An unexpected error occurred',
            successMessage: null,
          })
          return false
        }
      },

      /**
       * Clear profile state
       * Used on logout or error
       */
      clearProfile: () => {
        set({
          profile: null,
          membership: null,
          isLoading: false,
          isUpdating: false,
          isMembershipLoading: false,
          error: null,
          successMessage: null,
        })
      },

      // ==========================================
      // MEMBERSHIP ACTIONS
      // ==========================================

      /**
       * Fetch current user's IRCA membership
       * Updates membership state on success
       */
      fetchMembership: async () => {
        set({ isMembershipLoading: true, error: null })

        try {
          const result = await getCurrentMembershipAction()

          if (result.success && result.data) {
            set({
              membership: result.data,
              isMembershipLoading: false,
              error: null,
            })
          } else {
            set({
              membership: null,
              isMembershipLoading: false,
              error: result.message || 'Failed to fetch membership',
            })
          }
        } catch (error) {
          console.error('[Profile Store] Error fetching membership:', error)
          set({
            membership: null,
            isMembershipLoading: false,
            error: 'An unexpected error occurred',
          })
        }
      },

      /**
       * Check IRCA membership by ID
       * Returns membership data without updating profile
       * 
       * @param {string} membershipId - IRCA membership ID
       * @returns {Promise<IRCAMembershipData | null>} Membership data or null
       */
      checkMembership: async (membershipId: string) => {
        set({ isMembershipLoading: true, error: null })

        try {
          const result = await checkIRCAMembershipAction(membershipId)

          set({ isMembershipLoading: false })

          if (result.success && result.data) {
            return result.data
          } else {
            set({ error: result.message || 'Membership not found' })
            return null
          }
        } catch (error) {
          console.error('[Profile Store] Error checking membership:', error)
          set({
            isMembershipLoading: false,
            error: 'An unexpected error occurred',
          })
          return null
        }
      },

      /**
       * Link IRCA membership to user profile
       * 
       * @param {string} membershipId - IRCA membership ID
       * @returns {Promise<boolean>} Success status
       */
      linkMembership: async (membershipId: string) => {
        set({ isUpdating: true, error: null, successMessage: null })

        try {
          const result = await updateIRCAMembershipAction(membershipId)

          if (result.success) {
            // Update profile with new membership ID
            const currentProfile = get().profile
            if (currentProfile) {
              set({
                profile: {
                  ...currentProfile,
                  ircaMembershipId: membershipId,
                },
              })
            }

            // Fetch membership data
            await get().fetchMembership()

            set({
              isUpdating: false,
              successMessage: result.message || 'Membership linked successfully',
              error: null,
            })
            return true
          } else {
            set({
              isUpdating: false,
              error: result.message || 'Failed to link membership',
              successMessage: null,
            })
            return false
          }
        } catch (error) {
          console.error('[Profile Store] Error linking membership:', error)
          set({
            isUpdating: false,
            error: 'An unexpected error occurred',
            successMessage: null,
          })
          return false
        }
      },

      /**
       * Unlink IRCA membership from user profile
       * 
       * @returns {Promise<boolean>} Success status
       */
      unlinkMembership: async () => {
        set({ isUpdating: true, error: null, successMessage: null })

        try {
          const result = await updateIRCAMembershipAction(null)

          if (result.success) {
            // Update profile and clear membership
            const currentProfile = get().profile
            if (currentProfile) {
              set({
                profile: {
                  ...currentProfile,
                  ircaMembershipId: null,
                },
                membership: null,
              })
            }

            set({
              isUpdating: false,
              successMessage: result.message || 'Membership unlinked successfully',
              error: null,
            })
            return true
          } else {
            set({
              isUpdating: false,
              error: result.message || 'Failed to unlink membership',
              successMessage: null,
            })
            return false
          }
        } catch (error) {
          console.error('[Profile Store] Error unlinking membership:', error)
          set({
            isUpdating: false,
            error: 'An unexpected error occurred',
            successMessage: null,
          })
          return false
        }
      },

      // ==========================================
      // UI ACTIONS
      // ==========================================

      /**
       * Set error message
       * Used for displaying error alerts
       */
      setError: (error: string | null) => {
        set({ error, successMessage: null })
      },

      /**
       * Set success message
       * Used for displaying success alerts
       */
      setSuccess: (message: string | null) => {
        set({ successMessage: message, error: null })
      },

      /**
       * Clear all messages
       * Used after displaying alerts
       */
      clearMessages: () => {
        set({ error: null, successMessage: null })
      },
    }),
    { name: 'ProfileStore' }
  )
)

// ==========================================
// SELECTOR HOOKS
// ==========================================

/**
 * Custom hook to get profile data
 */
export const useProfile = () => useProfileStore((state) => state.profile)

/**
 * Custom hook to get membership data
 */
export const useMembership = () => useProfileStore((state) => state.membership)

/**
 * Custom hook to get loading states
 */
export const useProfileLoading = () =>
  useProfileStore((state) => ({
    isLoading: state.isLoading,
    isUpdating: state.isUpdating,
    isMembershipLoading: state.isMembershipLoading,
  }))

/**
 * Custom hook to get messages
 */
export const useProfileMessages = () =>
  useProfileStore((state) => ({
    error: state.error,
    successMessage: state.successMessage,
  }))
