// ==========================================
// HEADER COMPONENT
// ==========================================
// Responsive header with navigation, profile dropdown, and logout
// Features: Mobile hamburger menu, role-based navigation, avatar dropdown

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface NavLink {
  label: string
  href: string
  roles?: string[] // Which roles can see this link
}

export interface HeaderProps {
  /** Current user's display name */
  userName?: string
  /** Current user's role (MEMBER, ADMIN, SUPERADMIN) */
  userRole: string
  /** User's email or phone */
  userEmail?: string
  /** Avatar image URL (optional) */
  avatarUrl?: string
  /** Callback when logout is clicked */
  onLogout?: () => void
  /** Custom navigation links */
  navLinks?: NavLink[]
  /** Show/hide sidebar toggle button */
  showSidebarToggle?: boolean
  /** Callback for sidebar toggle */
  onSidebarToggle?: () => void
}

// ==========================================
// DEFAULT NAVIGATION LINKS
// ==========================================

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Bookings', href: '/bookings', roles: ['MEMBER', 'ADMIN'] },
  { label: 'Profile', href: '/profile', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Reports', href: '/reports', roles: ['ADMIN', 'SUPERADMIN'] },
  { label: 'Settings', href: '/settings', roles: ['SUPERADMIN'] },
]

// ==========================================
// HEADER COMPONENT
// ==========================================

/**
 * Header Component
 * 
 * Responsive header with:
 * - Logo and branding
 * - Role-based navigation links
 * - Profile avatar with dropdown menu
 * - Logout functionality
 * - Mobile hamburger menu
 * 
 * @example
 * ```tsx
 * <Header
 *   userName="John Doe"
 *   userRole="MEMBER"
 *   userEmail="john@example.com"
 *   onLogout={handleLogout}
 * />
 * ```
 */
export default function Header({
  userName = 'User',
  userRole,
  userEmail,
  avatarUrl,
  onLogout,
  navLinks = DEFAULT_NAV_LINKS,
  showSidebarToggle = true,
  onSidebarToggle,
}: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)

  // ==========================================
  // FILTER NAVIGATION BY ROLE
  // ==========================================
  const visibleNavLinks = navLinks.filter(
    (link) => !link.roles || link.roles.includes(userRole)
  )

  // ==========================================
  // LOGOUT HANDLER
  // ==========================================
  const handleLogout = () => {
    setProfileDropdownOpen(false)
    if (onLogout) {
      onLogout()
    } else {
      // Default logout behavior
      router.push('/login')
    }
  }

  // ==========================================
  // GET USER INITIALS FOR AVATAR
  // ==========================================
  const getUserInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // ==========================================
  // ROLE BADGE COLOR
  // ==========================================
  const getRoleBadgeColor = (role: string): string => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800'
      case 'MEMBER':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* ==========================================
              LEFT SECTION: Sidebar Toggle + Logo
          ========================================== */}
          <div className="flex items-center gap-4">
            {/* Sidebar Toggle (Desktop) */}
            {showSidebarToggle && (
              <button
                onClick={onSidebarToggle}
                className="hidden lg:block p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            )}

            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-linear-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="hidden sm:block text-xl font-bold text-gray-900">
                Hotel Booking
              </span>
            </Link>
          </div>

          {/* ==========================================
              CENTER SECTION: Navigation Links (Desktop)
          ========================================== */}
          <nav className="hidden md:flex items-center space-x-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ==========================================
              RIGHT SECTION: Profile Avatar + Dropdown
          ========================================== */}
          <div className="flex items-center gap-3">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg
                className="w-6 h-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>

            {/* Profile Avatar with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                {/* Avatar */}
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold border-2 border-gray-300">
                    {getUserInitials(userName)}
                  </div>
                )}

                {/* Chevron (Desktop only) */}
                <svg
                  className={`hidden sm:block w-4 h-4 text-gray-600 transition-transform ${
                    profileDropdownOpen ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  {/* Backdrop for closing dropdown */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />

                  {/* Dropdown Content */}
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    {/* User Info Section */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {userName}
                      </p>
                      {userEmail && (
                        <p className="text-xs text-gray-500 mt-1">{userEmail}</p>
                      )}
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                          userRole
                        )}`}
                      >
                        {userRole}
                      </span>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                          </svg>
                          View Profile
                        </div>
                      </Link>

                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setProfileDropdownOpen(false)}
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          Settings
                        </div>
                      </Link>
                    </div>

                    {/* Logout Section */}
                    <div className="border-t border-gray-200 py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                          </svg>
                          Logout
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            MOBILE MENU (Expanded)
        ========================================== */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  )
}
