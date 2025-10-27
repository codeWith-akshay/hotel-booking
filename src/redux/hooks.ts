/**
 * Typed Redux Hooks
 * 
 * Pre-typed versions of useDispatch and useSelector for use throughout the app.
 * These hooks include the correct TypeScript types for the Redux store.
 */

import { useDispatch, useSelector } from 'react-redux'
import type { TypedUseSelectorHook } from 'react-redux'
import type { RootState, AppDispatch } from './store'

/**
 * Use throughout app instead of plain `useDispatch`
 * Includes correct types for thunks
 */
export const useAppDispatch: () => AppDispatch = useDispatch

/**
 * Use throughout app instead of plain `useSelector`
 * Includes correct types for state
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
