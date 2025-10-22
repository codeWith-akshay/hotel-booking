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

/**
 * Navigation link interface
 */
export interface NavLink {
  /** Link label */
  label: string
  /** Link destination */
  href: string
  /** Optional icon (emoji or component) */
  icon?: string | React.ReactNode
  /** Which roles can see this link */
  roles?: string[]
  /** Optional badge text */
  badge?: string | number
}

/**
 * User information interface
 */
export interface HeaderUser {
  /** User's display name */
  name: string
  /** User's email */
  email?: string | null
  /** User's phone */
  phone?: string
  /** User's role (MEMBER, ADMIN, SUPERADMIN) */
  role: string
  /** Avatar image URL (optional) */
  avatarUrl?: string
  /** User ID */
  id?: string
}

/**
 * Header component props
 */
export interface HeaderProps {
  /** User information object */
  user: HeaderUser
  
  /** Number of unread notifications */
  notificationsCount?: number
  
  /** Callback when logout is clicked */
  onLogout: () => void
  
  /** Custom navigation links */
  navLinks?: NavLink[]
  
  /** Show/hide sidebar toggle button */
  showSidebarToggle?: boolean
  
  /** Callback for sidebar toggle */
  onSidebarToggle?: () => void
  
  /** Show/hide notifications bell */
  showNotifications?: boolean
  
  /** Callback when notification bell is clicked */
  onNotificationClick?: () => void
  
  /** Show/hide search bar */
  showSearch?: boolean
  
  /** Search placeholder text */
  searchPlaceholder?: string
  
  /** Callback when search is submitted */
  onSearch?: (query: string) => void
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
 * - Notifications bell with count badge
 * - Profile avatar with dropdown menu
 * - Logout functionality
 * - Mobile hamburger menu
 * - Optional search bar
 * 
 * @example
 * ```tsx
 * <Header
 *   user={{
 *     name: "John Doe",
 *     email: "john@example.com",
 *     role: "MEMBER"
 *   }}
 *   notificationsCount={5}
 *   onLogout={handleLogout}
 * />
 * ```
 */
export default function Header({
  user,
  notificationsCount = 0,
  onLogout,
  navLinks = DEFAULT_NAV_LINKS,
  showSidebarToggle = true,
  onSidebarToggle,
  showNotifications = true,
  onNotificationClick,
  showSearch = false,
  searchPlaceholder = 'Search...',
  onSearch,
}: HeaderProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // ==========================================
  // FILTER NAVIGATION BY ROLE
  // ==========================================
  const visibleNavLinks = navLinks.filter(
    (link) => !link.roles || link.roles.includes(user.role)
  )

  // ==========================================
  // LOGOUT HANDLER
  // ==========================================
  const handleLogout = () => {
    setProfileDropdownOpen(false)
    onLogout()
  }

  // ==========================================
  // NOTIFICATION HANDLER
  // ==========================================
  const handleNotificationClick = () => {
    setNotificationsOpen(!notificationsOpen)
    if (onNotificationClick) {
      onNotificationClick()
    }
  }

  // ==========================================
  // SEARCH HANDLER
  // ==========================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim())
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

  // ==========================================
  // GET DISPLAY EMAIL/PHONE
  // ==========================================
  const getDisplayContact = (): string => {
    return user.email || user.phone || ''
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
              CENTER SECTION: Navigation Links (Desktop) + Search
          ========================================== */}
          <div className="hidden md:flex items-center gap-4 flex-1 justify-center max-w-2xl">
            {/* Search Bar */}
            {showSearch && (
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full px-4 py-2 pl-10 pr-4 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </form>
            )}

            {/* Navigation Links */}
            {!showSearch && (
              <nav className="flex items-center space-x-1">
                {visibleNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-4 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-2"
                  >
                    {link.icon && (
                      <span className="text-base">
                        {typeof link.icon === 'string' ? link.icon : link.icon}
                      </span>
                    )}
                    {link.label}
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* ==========================================
              RIGHT SECTION: Notifications + Profile Avatar
          ========================================== */}
          <div className="flex items-center gap-2">
            {/* Notifications Bell */}
            {showNotifications && (
              <div className="relative">
                <button
                  onClick={handleNotificationClick}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
                  aria-label="Notifications"
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
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationsCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full min-w-[18px]">
                      {notificationsCount > 99 ? '99+' : notificationsCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto">
                      <div className="px-4 py-2 border-b border-gray-200">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Notifications
                          {notificationsCount > 0 && (
                            <span className="ml-2 text-xs text-gray-500">
                              ({notificationsCount} unread)
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="py-2">
                        {notificationsCount === 0 ? (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            No new notifications
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600 px-4 py-2">
                            Notification content goes here...
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

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
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-semibold border-2 border-gray-300">
                    {getUserInitials(user.name)}
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
                        {user.name}
                      </p>
                      {getDisplayContact() && (
                        <p className="text-xs text-gray-500 mt-1">{getDisplayContact()}</p>
                      )}
                      <span
                        className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
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
