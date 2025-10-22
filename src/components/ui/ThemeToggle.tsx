'use client'

// ==========================================
// THEME TOGGLE COMPONENT
// ==========================================
// Button and dropdown for switching themes

import React, { useState, useRef, useEffect } from 'react'
import { useThemeStore, type ThemeMode } from '@/store/theme.store'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

interface ThemeToggleProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show label text */
  showLabel?: boolean
  /** Custom class name */
  className?: string
  /** Display as dropdown (default) or inline buttons */
  variant?: 'dropdown' | 'buttons'
}

// ==========================================
// ICONS
// ==========================================

const SunIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </svg>
)

const MoonIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
  </svg>
)

const SystemIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
)

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ==========================================
// THEME OPTIONS
// ==========================================

const THEME_OPTIONS: Array<{
  value: ThemeMode
  label: string
  description: string
  icon: typeof SunIcon
}> = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light color scheme',
    icon: SunIcon,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark color scheme',
    icon: MoonIcon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Use system preference',
    icon: SystemIcon,
  },
]

// ==========================================
// SIZE CLASSES
// ==========================================

const SIZE_CLASSES = {
  sm: {
    button: 'h-8 px-2',
    icon: 'h-4 w-4',
    text: 'text-xs',
  },
  md: {
    button: 'h-10 px-3',
    icon: 'h-5 w-5',
    text: 'text-sm',
  },
  lg: {
    button: 'h-12 px-4',
    icon: 'h-6 w-6',
    text: 'text-base',
  },
}

// ==========================================
// DROPDOWN VARIANT
// ==========================================

export function ThemeToggle({
  size = 'md',
  showLabel = false,
  className = '',
  variant = 'dropdown',
}: ThemeToggleProps) {
  const { mode, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Get current theme option
  const currentOption = THEME_OPTIONS.find((opt) => opt.value === mode) ?? THEME_OPTIONS[2]!
  const CurrentIcon = currentOption.icon

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
    return undefined
  }, [isOpen])

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
    return undefined
  }, [isOpen])

  if (variant === 'buttons') {
    return (
      <div className={`inline-flex rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon
          const isActive = mode === option.value
          const sizeClasses = SIZE_CLASSES[size]

          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={`
                ${sizeClasses.button} ${sizeClasses.text}
                flex items-center gap-2 font-medium transition-colors
                first:rounded-l-lg last:rounded-r-lg
                ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                }
              `}
              title={option.description}
              aria-label={option.label}
            >
              <Icon className={sizeClasses.icon} />
              {showLabel && <span>{option.label}</span>}
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant (default)
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${SIZE_CLASSES[size].button}
          flex items-center gap-2 rounded-lg border border-gray-200 bg-white
          text-gray-700 transition-colors hover:bg-gray-50
          dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
        `}
        title={currentOption.description}
        aria-label="Toggle theme"
        aria-expanded={isOpen}
      >
        <CurrentIcon className={SIZE_CLASSES[size].icon} />
        {showLabel && (
          <span className={SIZE_CLASSES[size].text}>{currentOption.label}</span>
        )}
        {/* Chevron */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="
            absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg border
            border-gray-200 bg-white shadow-lg
            dark:border-gray-700 dark:bg-gray-800
          "
          role="menu"
          aria-orientation="vertical"
        >
          <div className="p-1">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon
              const isActive = mode === option.value

              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setTheme(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm
                    transition-colors
                    ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700'
                    }
                  `}
                  role="menuitem"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <div className="flex-1">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs opacity-60">{option.description}</div>
                  </div>
                  {isActive && <CheckIcon className="h-5 w-5 shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// SIMPLE TOGGLE (Quick Switch)
// ==========================================

export function SimpleThemeToggle({
  size = 'md',
  className = '',
}: Omit<ThemeToggleProps, 'showLabel' | 'variant'>) {
  const { toggleTheme, resolvedTheme } = useThemeStore()
  const isDark = resolvedTheme === 'dark'
  const sizeClasses = SIZE_CLASSES[size]

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${sizeClasses.button}
        flex items-center justify-center rounded-lg border border-gray-200 bg-white
        text-gray-700 transition-colors hover:bg-gray-50
        dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700
        ${className}
      `}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <SunIcon className={sizeClasses.icon} />
      ) : (
        <MoonIcon className={sizeClasses.icon} />
      )}
    </button>
  )
}

// ==========================================
// THEME STATUS (Display only)
// ==========================================

export function ThemeStatus({ className = '' }: { className?: string }) {
  const { mode, resolvedTheme, useSystemTheme } = useThemeStore()
  
  // Always fallback to system option
  const option = THEME_OPTIONS.find((opt) => opt.value === mode) || THEME_OPTIONS[2]
  if (!option) return null
  
  const Icon = option.icon

  return (
    <div
      className={`
        flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm
        dark:border-gray-700 dark:bg-gray-800
        ${className}
      `}
    >
      <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
      <div>
        <div className="font-medium text-gray-900 dark:text-gray-100">
          {option.label}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {useSystemTheme ? `Resolved: ${resolvedTheme}` : option.description}
        </div>
      </div>
    </div>
  )
}
