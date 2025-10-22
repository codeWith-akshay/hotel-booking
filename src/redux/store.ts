// ==========================================
// REDUX STORE CONFIGURATION
// ==========================================
// Central Redux store setup with Redux Toolkit
// Includes middleware configuration and type definitions

import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'

// Import reducers
import bookingsReducer from './slices/bookingsSlice'

// ==========================================
// ROOT REDUCER
// ==========================================
// Combine all slice reducers into root reducer

const rootReducer = combineReducers({
  bookings: bookingsReducer,
  // Add more reducers here as your app grows:
  // rooms: roomsReducer,
  // guests: guestsReducer,
  // auth: authReducer, // If you want to migrate Zustand auth to Redux
})

// ==========================================
// STORE CONFIGURATION
// ==========================================

/**
 * Configure and create the Redux store
 * 
 * Features:
 * - Redux DevTools enabled in development
 * - Automatic serialization checks
 * - Immutability checks in development
 * - Custom middleware can be added
 */
export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    
    // Middleware configuration
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // Serialization check options
        serializableCheck: {
          // Ignore these action types (if you dispatch non-serializable values)
          ignoredActions: [
            // Add action types to ignore
            // e.g., 'bookings/setCustomObject'
          ],
          // Ignore these field paths in state
          ignoredActionPaths: [
            // e.g., 'payload.timestamp'
          ],
          ignoredPaths: [
            // e.g., 'bookings.someNonSerializableField'
          ],
        },
        
        // Immutability check (only in development)
        immutableCheck: process.env.NODE_ENV === 'development',
      }),
    
    // Enable Redux DevTools in development
    devTools: process.env.NODE_ENV === 'development',
  })
}

// Create store instance
export const store = makeStore()

// ==========================================
// TYPESCRIPT TYPES
// ==========================================

/**
 * Infer the `RootState` type from the store itself
 * Use this type when selecting state with useSelector
 */
export type RootState = ReturnType<typeof store.getState>

/**
 * Infer the `AppDispatch` type from the store
 * Use this type when dispatching actions
 */
export type AppDispatch = typeof store.dispatch

/**
 * App store type
 */
export type AppStore = ReturnType<typeof makeStore>

// ==========================================
// TYPED HOOKS
// ==========================================
// Pre-typed versions of useDispatch and useSelector hooks
// Use these throughout your app instead of plain `useDispatch` and `useSelector`

/**
 * Typed useDispatch hook
 * Use this instead of plain `useDispatch` to get type safety
 * 
 * @example
 * const dispatch = useAppDispatch()
 * dispatch(fetchBookings())
 */
export const useAppDispatch: () => AppDispatch = useDispatch

/**
 * Typed useSelector hook
 * Use this instead of plain `useSelector` to get type safety
 * 
 * @example
 * const bookings = useAppSelector((state) => state.bookings.bookings)
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// ==========================================
// STORE UTILITIES
// ==========================================

/**
 * Get current state snapshot
 * Useful for debugging or server-side operations
 * 
 * @example
 * const currentState = getState()
 * console.log(currentState.bookings)
 */
export const getState = () => store.getState()

/**
 * Subscribe to store changes
 * Returns unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToStore(() => {
 *   console.log('State changed:', getState())
 * })
 * // Later: unsubscribe()
 */
export const subscribeToStore = (listener: () => void) => {
  return store.subscribe(listener)
}

// ==========================================
// EXPORTS
// ==========================================

export default store
