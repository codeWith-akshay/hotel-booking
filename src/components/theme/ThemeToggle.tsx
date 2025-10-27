// ==========================================
// THEME TOGGLE BUTTON
// ==========================================
// Button component for toggling between light and dark themes
// Features: Animated icon transitions, accessibility, tooltips

'use client'

import { useThemeStore } from '@/store/themeStore'
import { Moon, Sun } from 'lucide-react'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface ThemeToggleProps {
  /** Show label text */
  showLabel?: boolean
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Additional CSS classes */
  className?: string
  /** Show tooltip */
  showTooltip?: boolean
}

// ==========================================
// THEME TOGGLE COMPONENT
// ==========================================

/**
 * Theme Toggle Button
 * 
 * Toggles between light and dark themes with animated icon.
 * Fully accessible with ARIA labels and keyboard navigation.
 * 
 * @example
 * ```tsx
 * import { ThemeToggle } from '@/components/theme/ThemeToggle'
 * 
 * function Header() {
 *   return (
 *     <header>
 *       <ThemeToggle />
 *     </header>
 *   )
 * }
 * ```
 */
export function ThemeToggle({
  showLabel = false,
  size = 'md',
  className = '',
  showTooltip = true,
}: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useThemeStore()
  
  // Size classes
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3',
  }
  
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }
  
  const isDark = resolvedTheme === 'dark'
  
  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses[size]}
        relative rounded-lg
        bg-gray-100 dark:bg-gray-800
        hover:bg-gray-200 dark:hover:bg-gray-700
        focus-ring
        transition-all duration-300 ease-in-out
        touch-target
        group
        ${className}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={showTooltip ? `Switch to ${isDark ? 'light' : 'dark'} mode` : undefined}
      type="button"
    >
      <div className="relative flex items-center justify-center">
        {/* Sun Icon (Light Mode) */}
        <Sun
          className={`
            ${iconSizes[size]}
            absolute
            text-yellow-500
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}
          `}
          aria-hidden="true"
        />
        
        {/* Moon Icon (Dark Mode) */}
        <Moon
          className={`
            ${iconSizes[size]}
            absolute
            text-blue-400
            transition-all duration-300 ease-in-out
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
          `}
          aria-hidden="true"
        />
        
        {/* Spacer to maintain button size */}
        <div className={iconSizes[size]} />
      </div>
      
      {/* Label (Optional) */}
      {showLabel && (
        <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
      
      {/* Tooltip on Hover (Optional) */}
      {showTooltip && (
        <span
          className="
            absolute -top-10 left-1/2 -translate-x-1/2
            px-2 py-1
            bg-gray-900 dark:bg-gray-700
            text-white text-xs rounded
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            pointer-events-none
            whitespace-nowrap
            z-50
          "
          role="tooltip"
        >
          {isDark ? 'Light mode' : 'Dark mode'}
          <span
            className="
              absolute top-full left-1/2 -translate-x-1/2
              border-4 border-transparent border-t-gray-900 dark:border-t-gray-700
            "
          />
        </span>
      )}
    </button>
  )
}

// ==========================================
// THEME TOGGLE WITH DROPDOWN (Alternative)
// ==========================================

/**
 * Theme Toggle Dropdown
 * 
 * Dropdown menu for selecting theme (light/dark/system).
 * 
 * @example
 * ```tsx
 * import { ThemeToggleDropdown } from '@/components/theme/ThemeToggle'
 * 
 * function Settings() {
 *   return <ThemeToggleDropdown />
 * }
 * ```
 */
export function ThemeToggleDropdown() {
  const { theme, setTheme } = useThemeStore()
  
  const themes: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { 
      value: 'system', 
      label: 'System', 
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ) 
    },
  ]
  
  return (
    <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-800">
      {themes.map((item) => (
        <button
          key={item.value}
          onClick={() => setTheme(item.value)}
          className={`
            px-3 py-1.5 rounded-md
            text-sm font-medium
            transition-all duration-300 ease-in-out
            focus-ring
            ${
              theme === item.value
                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
          aria-label={`Switch to ${item.label} mode`}
          aria-pressed={theme === item.value}
        >
          <span className="flex items-center gap-2">
            {item.icon}
            <span>{item.label}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
