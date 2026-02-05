'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme/ThemeToggle'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface NavLink {
  label: string
  href: string
  icon?: string | React.ReactNode
  roles?: string[]
  badge?: string | number
}

export interface HeaderUser {
  name?: string | null
  email?: string | null
  phone?: string
  role: string
  avatarUrl?: string
  id?: string
}

export interface HeaderProps {
  user: HeaderUser
  notificationsCount?: number
  onLogout: () => void
  navLinks?: NavLink[]
  showSidebarToggle?: boolean
  onSidebarToggle?: () => void
  showNotifications?: boolean
  onNotificationClick?: () => void
  showSearch?: boolean
  searchPlaceholder?: string
  onSearch?: (query: string) => void
}

// ==========================================
// DEFAULT NAVIGATION LINKS
// ==========================================

const DEFAULT_NAV_LINKS: NavLink[] = [
  { label: 'Dashboard', href: '/dashboard', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Rooms', href: '/rooms', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Book Now', href: '/booking', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Profile', href: '/profile', roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'] },
  { label: 'Admin', href: '/admin', roles: ['ADMIN', 'SUPERADMIN'] },
  { label: 'Superadmin', href: '/superadmin', roles: ['SUPERADMIN'] },
]

// ==========================================
// HEADER COMPONENT
// ==========================================

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

  const visibleNavLinks = navLinks.filter(
    (link) => !link.roles || link.roles.includes(user.role)
  )

  const handleLogout = () => {
    setProfileDropdownOpen(false)
    onLogout()
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim())
    }
  }

  // ==========================================
  // ✅ SAFE USER INITIALS (FIXED)
  // ==========================================
  const getUserInitials = (name?: string | null): string => {
    if (!name || typeof name !== 'string') return 'U'

    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

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

  const getDisplayContact = (): string => {
    return user.email || user.phone || ''
  }

  const displayName = user.name || 'User'

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center">
              H
            </div>
            <span className="hidden sm:block">Hotel Booking</span>
          </Link>

          {/* RIGHT */}
          <div className="flex items-center gap-3">

            <ThemeToggle size="md" />

            {/* PROFILE */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={displayName}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                    {getUserInitials(displayName)}
                  </div>
                )}
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-50">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold">{displayName}</p>
                    {getDisplayContact() && (
                      <p className="text-xs text-gray-500">{getDisplayContact()}</p>
                    )}
                    <span
                      className={`inline-block mt-2 px-2 py-1 text-xs rounded ${getRoleBadgeColor(
                        user.role
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>

                  <Link
                    href="/profile"
                    className="block px-4 py-2 hover:bg-gray-100"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    Profile
                  </Link>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
