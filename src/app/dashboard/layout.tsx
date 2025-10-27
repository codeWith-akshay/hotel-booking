'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Sidebar from '@/components/layout/Sidebar'
import type { SidebarLink } from '@/components/layout/Sidebar'

// ==========================================
// DASHBOARD NAVIGATION LINKS
// ==========================================

const dashboardLinks: SidebarLink[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    label: 'Profile',
    href: '/profile/setup',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
  {
    label: 'Bookings',
    href: '/bookings',
    roles: ['MEMBER', 'ADMIN'],
    badge: '0',
    badgeVariant: 'primary',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    roles: ['ADMIN', 'SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    ),
  },
]

// ==========================================
// DASHBOARD LAYOUT
// ==========================================

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        links={dashboardLinks}
        activeRoute={pathname}
        userRole={user?.role || 'MEMBER'}
        isOpen={sidebarOpen}
        onToggle={setSidebarOpen}
        showOnDesktop={true}
        showFooter={true}
        footerContent={
          <div className="text-xs text-gray-500 text-center">
            <p>Hotel Booking System</p>
            <p className="mt-1">v1.0.0</p>
          </div>
        }
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Menu Button */}
        <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
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
        </div>

        {/* Page Content */}
        <main id="main-content" className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}
