// ==========================================
// ACCESSIBILITY HOOKS
// ==========================================
// Reusable hooks for WCAG 2.1 AA compliance

'use client'

import { useEffect, useRef, useCallback, RefObject } from 'react'

// ==========================================
// FOCUS TRAP HOOK
// ==========================================

/**
 * Hook to trap focus within a container (for modals, dialogs)
 * 
 * @example
 * ```tsx
 * const ref = useFocusTrap<HTMLDivElement>(isOpen)
 * return <div ref={ref}>Modal content</div>
 * ```
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean
) {
  const ref = useRef<T>(null)

  useEffect(() => {
    if (!isActive || !ref.current) return

    const element = ref.current
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element on mount
    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          lastElement?.focus()
          e.preventDefault()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          firstElement?.focus()
          e.preventDefault()
        }
      }
    }

    element.addEventListener('keydown', handleTabKey)

    return () => {
      element.removeEventListener('keydown', handleTabKey)
    }
  }, [isActive])

  return ref
}

// ==========================================
// ESCAPE KEY HANDLER
// ==========================================

/**
 * Hook to handle Escape key press
 * 
 * @example
 * ```tsx
 * useEscapeKey(() => setModalOpen(false), isModalOpen)
 * ```
 */
export function useEscapeKey(
  callback: () => void,
  isActive: boolean = true
) {
  useEffect(() => {
    if (!isActive) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        callback()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [callback, isActive])
}

// ==========================================
// KEYBOARD NAVIGATION HOOK
// ==========================================

/**
 * Hook for arrow key navigation in lists/grids
 * 
 * @example
 * ```tsx
 * const { activeIndex, setActiveIndex } = useKeyboardNavigation(items.length, {
 *   onSelect: (index) => handleSelect(items[index])
 * })
 * ```
 */
export function useKeyboardNavigation(
  itemCount: number,
  options: {
    onSelect?: (index: number) => void
    loop?: boolean
    orientation?: 'vertical' | 'horizontal' | 'grid'
    gridColumns?: number
  } = {}
) {
  const { onSelect, loop = true, orientation = 'vertical', gridColumns = 1 } = options
  const activeIndexRef = useRef(0)

  const navigate = useCallback(
    (direction: 'up' | 'down' | 'left' | 'right') => {
      const currentIndex = activeIndexRef.current
      let newIndex = currentIndex

      if (orientation === 'vertical') {
        if (direction === 'down') newIndex++
        if (direction === 'up') newIndex--
      } else if (orientation === 'horizontal') {
        if (direction === 'right') newIndex++
        if (direction === 'left') newIndex--
      } else if (orientation === 'grid') {
        if (direction === 'down') newIndex += gridColumns
        if (direction === 'up') newIndex -= gridColumns
        if (direction === 'right') newIndex++
        if (direction === 'left') newIndex--
      }

      // Handle boundaries
      if (loop) {
        newIndex = (newIndex + itemCount) % itemCount
      } else {
        newIndex = Math.max(0, Math.min(itemCount - 1, newIndex))
      }

      activeIndexRef.current = newIndex
      return newIndex
    },
    [itemCount, loop, orientation, gridColumns]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const keyMap: Record<string, 'up' | 'down' | 'left' | 'right'> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      }

      const direction = keyMap[event.key]
      if (!direction) return

      event.preventDefault()
      const newIndex = navigate(direction)

      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onSelect?.(activeIndexRef.current)
      }

      return newIndex
    },
    [navigate, onSelect]
  )

  return {
    activeIndex: activeIndexRef.current,
    handleKeyDown,
    navigate,
  }
}

// ==========================================
// FOCUS VISIBLE HOOK
// ==========================================

/**
 * Hook to detect when focus should be visible (keyboard vs mouse)
 * 
 * @example
 * ```tsx
 * const { isFocusVisible, focusVisibleProps } = useFocusVisible()
 * return <button {...focusVisibleProps}>Click me</button>
 * ```
 */
export function useFocusVisible() {
  const isFocusVisibleRef = useRef(false)
  const hadKeyboardEventRef = useRef(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        hadKeyboardEventRef.current = true
      }
    }

    const handleMouseDown = () => {
      hadKeyboardEventRef.current = false
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  return {
    isFocusVisible: isFocusVisibleRef.current,
    focusVisibleProps: {
      onFocus: () => {
        if (hadKeyboardEventRef.current) {
          isFocusVisibleRef.current = true
        }
      },
      onBlur: () => {
        isFocusVisibleRef.current = false
      },
    },
  }
}

// ==========================================
// LIVE REGION ANNOUNCER
// ==========================================

/**
 * Hook to announce messages to screen readers
 * 
 * @example
 * ```tsx
 * const announce = useAnnouncer()
 * announce('Form submitted successfully', 'polite')
 * ```
 */
export function useAnnouncer() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcer = document.createElement('div')
      announcer.setAttribute('role', 'status')
      announcer.setAttribute('aria-live', priority)
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      announcer.textContent = message

      document.body.appendChild(announcer)

      setTimeout(() => {
        document.body.removeChild(announcer)
      }, 1000)
    },
    []
  )

  return announce
}

// ==========================================
// REDUCED MOTION DETECTION
// ==========================================

/**
 * Hook to detect if user prefers reduced motion
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion()
 * const transition = prefersReducedMotion ? 'none' : 'all 0.3s'
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const prefersReducedMotionRef = useRef(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotionRef.current = mediaQuery.matches

    const handleChange = () => {
      prefersReducedMotionRef.current = mediaQuery.matches
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return prefersReducedMotionRef.current
}

// ==========================================
// SCROLLABLE REGION HOOK
// ==========================================

/**
 * Hook to manage scrollable region accessibility
 * 
 * @example
 * ```tsx
 * const ref = useScrollableRegion<HTMLDivElement>({
 *   label: 'Chat messages',
 *   onScrollEnd: loadMore
 * })
 * ```
 */
export function useScrollableRegion<T extends HTMLElement>(options: {
  label?: string
  onScrollEnd?: () => void
  threshold?: number
}) {
  const { label, onScrollEnd, threshold = 50 } = options
  const ref = useRef<T>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    // Add ARIA attributes
    if (label) {
      element.setAttribute('aria-label', label)
    }
    element.setAttribute('role', 'region')
    element.setAttribute('tabindex', '0')

    // Handle scroll to end
    const handleScroll = () => {
      if (!onScrollEnd) return

      const { scrollTop, scrollHeight, clientHeight } = element
      if (scrollHeight - scrollTop - clientHeight < threshold) {
        onScrollEnd()
      }
    }

    element.addEventListener('scroll', handleScroll)

    return () => {
      element.removeEventListener('scroll', handleScroll)
    }
  }, [label, onScrollEnd, threshold])

  return ref
}
