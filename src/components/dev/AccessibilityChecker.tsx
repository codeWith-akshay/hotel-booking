// @ts-nocheck
// ==========================================
// ACCESSIBILITY CHECKER (DEVELOPMENT ONLY)
// ==========================================
// Uses @axe-core/react to check for accessibility issues during development
// Only loads in development mode to avoid production bundle bloat

'use client'

import { useEffect } from 'react'

/**
 * AccessibilityChecker Component
 * 
 * Runs axe-core accessibility audits in development mode only.
 * Reports issues to the browser console with detailed information.
 * 
 * **Important**: This component should ONLY be used in development.
 * It will not load in production builds.
 * 
 * @example
 * ```tsx
 * // In layout.tsx or top-level component
 * import { AccessibilityChecker } from '@/components/dev/AccessibilityChecker'
 * 
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AccessibilityChecker />
 *         {children}
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 * 
 * @see https://github.com/dequelabs/axe-core-npm/tree/develop/packages/react
 */
export function AccessibilityChecker() {
  useEffect(() => {
    // Only run in development mode
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Only run in browser environment
    if (typeof window === 'undefined') {
      return
    }

    // Dynamically import axe-core to avoid loading it in production
    import('@axe-core/react')
      .then((axe) => {
        // Default config matches our requirements
        const config = {
          // Run checks every 1 second after changes
          debounce: 1000,
          
          // Only check rules that match WCAG 2.1 AA
          rules: [
            // These match WCAG 2.1 Level A and AA
            { id: 'wcag2a', enabled: true },
            { id: 'wcag2aa', enabled: true },
            { id: 'wcag21a', enabled: true },
            { id: 'wcag21aa', enabled: true },
          ],
        }

        // Initialize axe with React and Next.js
        axe.default(window.React, window.ReactDOM, 1000, config)

        console.log(
          '%c♿ Accessibility Checker Active',
          'background: #4338ca; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;',
          '\n\nChecking for WCAG 2.1 AA violations...\nIssues will appear in the console below.'
        )
      })
      .catch((error) => {
        console.error('Failed to initialize @axe-core/react:', error)
      })
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Manual Accessibility Check Function
 * 
 * Run a one-time accessibility audit programmatically.
 * Useful for testing specific components or interactions.
 * 
 * @example
 * ```tsx
 * import { runAccessibilityCheck } from '@/components/dev/AccessibilityChecker'
 * 
 * // After opening a modal
 * const handleOpenModal = () => {
 *   setModalOpen(true)
 *   setTimeout(() => runAccessibilityCheck(), 100) // Wait for render
 * }
 * ```
 */
export async function runAccessibilityCheck(): Promise<any | undefined> {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('runAccessibilityCheck() only works in development mode')
    return undefined
  }

  if (typeof window === 'undefined') {
    return undefined
  }

  try {
    const axe = await import('axe-core')
    const results = await axe.default.run()

    if (results.violations.length === 0) {
      console.log(
        '%c✓ No accessibility violations found',
        'background: #16a34a; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      )
    } else {
      console.group(
        `%c⚠ ${results.violations.length} Accessibility Violation${results.violations.length > 1 ? 's' : ''} Found`,
        'background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;'
      )

      results.violations.forEach((violation: any) => {
        console.group(`${violation.impact?.toUpperCase()}: ${violation.help}`)
        console.log('Description:', violation.description)
        console.log('WCAG Tags:', violation.tags.join(', '))
        console.log('Help URL:', violation.helpUrl)
        console.log('Affected elements:', violation.nodes.length)
        
        violation.nodes.forEach((node: any, index: number) => {
          console.group(`Element ${index + 1}`)
          console.log('HTML:', node.html)
          console.log('Target:', node.target)
          console.log('Failure summary:', node.failureSummary)
          console.groupEnd()
        })
        
        console.groupEnd()
      })

      console.groupEnd()
    }

    return results
  } catch (error) {
    console.error('Failed to run accessibility check:', error)
    return undefined
  }
}

/**
 * Accessibility Check Hook
 * 
 * React hook to run accessibility checks when component mounts.
 * 
 * @example
 * ```tsx
 * import { useAccessibilityCheck } from '@/components/dev/AccessibilityChecker'
 * 
 * function MyComponent() {
 *   // Runs check on mount and when dependencies change
 *   useAccessibilityCheck([someDependency])
 *   
 *   return <div>...</div>
 * }
 * ```
 */
export function useAccessibilityCheck(dependencies: any[] = []) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') {
      return
    }

    // Wait a bit for DOM to settle
    const timeoutId = setTimeout(() => {
      runAccessibilityCheck()
    }, 500)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies)
}

// Export types for TypeScript users
export type AccessibilityCheckResult = Awaited<ReturnType<typeof runAccessibilityCheck>>
