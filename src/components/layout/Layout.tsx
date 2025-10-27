// ==========================================
// MAIN LAYOUT COMPONENT
// ==========================================
// Combines Header, Sidebar, Footer with responsive grid
// Features: Mobile-first, collapsible sidebar, role-based navigation

'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Header, { type NavLink, type HeaderUser } from './Header'
import Sidebar, { type SidebarLink } from './Sidebar'
import Footer from './Footer'
import { getNavigationForRole, type UserRole } from '@/lib/navigation.utils'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface LayoutProps {
  /** Main content to render */
  children: React.ReactNode
  
  /** User information - passed to Header and Sidebar */
  user: HeaderUser
  
  /** Layout configuration */
  config?: {
    /** Show/hide header */
    showHeader?: boolean
    /** Show/hide sidebar */
    showSidebar?: boolean
    /** Show/hide footer */
    showFooter?: boolean
    /** Custom header navigation links (overrides role-based defaults) */
    headerNavLinks?: NavLink[]
    /** Custom sidebar links (overrides role-based defaults) */
    sidebarLinks?: SidebarLink[]
    /** Notifications count for Header bell */
    notificationsCount?: number
    /** Show search bar in Header */
    showSearch?: boolean
    /** Search placeholder text */
    searchPlaceholder?: string
    /** Company name for footer */
    companyName?: string
  }
  
  /** Callback when user logs out (required) */
  onLogout: () => void
  
  /** Callback when search is submitted */
  onSearch?: (query: string) => void
  
  /** Callback when notifications bell is clicked */
  onNotificationClick?: () => void
  
  /** Additional CSS class for main content area */
  contentClassName?: string
}

// ==========================================
// MAIN LAYOUT COMPONENT
// ==========================================

/**
 * Main Layout Component
 * 
 * Responsive application shell with:
 * - Sticky header with navigation and profile
 * - Collapsible sidebar (desktop) / drawer (mobile)
 * - Main content area with children
 * - Footer with links and copyright
 * - Role-based navigation filtering
 * - Mobile-first responsive design
 * 
 * @example
 * ```tsx
 * <Layout
 *   user={{
 *     name: "John Doe",
 *     email: "john@example.com",
 *     role: "MEMBER"
 *   }}
 *   onLogout={handleLogout}
 * >
 *   <YourPageContent />
 * </Layout>
 * ```
 */
export default function Layout({
  children,
  user,
  config = {},
  onLogout,
  onSearch,
  onNotificationClick,
  contentClassName = '',
}: LayoutProps) {
  const {
    showHeader = true,
    showSidebar = true,
    showFooter = true,
    headerNavLinks,
    sidebarLinks,
    notificationsCount = 0,
    showSearch = false,
    searchPlaceholder,
    companyName,
  } = config

  // Get current route for active link highlighting
  const pathname = usePathname()

  // Get role-based navigation if custom links not provided
  const roleNavigation = getNavigationForRole(user.role as UserRole)
  const effectiveHeaderLinks = headerNavLinks || roleNavigation.headerLinks
  const effectiveSidebarLinks = sidebarLinks || roleNavigation.sidebarLinks()

  // ==========================================
  // SIDEBAR STATE MANAGEMENT
  // ==========================================
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  // ==========================================
  // HANDLE RESPONSIVE BEHAVIOR
  // ==========================================
  useEffect(() => {
    // Check if mobile on mount
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      setSidebarOpen(!mobile) // Close sidebar on mobile, open on desktop
    }

    checkMobile()

    // Listen for resize events
    const handleResize = () => {
      checkMobile()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ==========================================
  // SIDEBAR TOGGLE HANDLER
  // ==========================================
  const handleSidebarToggle = (open?: boolean) => {
    if (open !== undefined) {
      setSidebarOpen(open)
    } else {
      setSidebarOpen((prev) => !prev)
    }
  }

  // ==========================================
  // CLOSE SIDEBAR ON MOBILE WHEN ROUTE CHANGES
  // ==========================================
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [isMobile])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* ==========================================
          HEADER
      ========================================== */}
      {showHeader && (
        <Header
          user={user}
          navLinks={effectiveHeaderLinks}
          notificationsCount={notificationsCount}
          showNotifications={true}
          showSearch={showSearch}
          {...(searchPlaceholder && { searchPlaceholder })}
          onLogout={onLogout}
          {...(onSearch && { onSearch })}
          {...(onNotificationClick && { onNotificationClick })}
          showSidebarToggle={showSidebar}
          onSidebarToggle={handleSidebarToggle}
        />
      )}

      {/* ==========================================
          MAIN LAYOUT: Sidebar + Content
      ========================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        {showSidebar && (
          <Sidebar
            userRole={user.role}
            links={effectiveSidebarLinks}
            activeRoute={pathname}
            isOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            showOnDesktop={true}
            showFooter={true}
          />
        )}

        {/* MAIN CONTENT AREA */}
        <main
          className={`
            flex-1 overflow-y-auto
            ${showSidebar ? 'lg:ml-0' : ''}
            ${contentClassName}
          `}
        >
          {/* Content Container with Padding */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>

          {/* FOOTER */}
          {showFooter && <Footer {...(companyName && { companyName })} />}
        </main>
      </div>
    </div>
  )
}

// ==========================================
// LAYOUT VARIANTS FOR SPECIFIC PAGES
// ==========================================

/**
 * Simple Layout (No Sidebar)
 * 
 * For pages that don't need sidebar navigation
 * (e.g., Profile, Settings, Booking Details)
 */
export function SimpleLayout({
  children,
  user,
  onLogout,
  contentClassName = '',
}: Omit<LayoutProps, 'config'> & { onLogout: () => void }) {
  return (
    <Layout
      user={user}
      onLogout={onLogout}
      config={{
        showSidebar: false,
        showFooter: true,
      }}
      contentClassName={contentClassName}
    >
      {children}
    </Layout>
  )
}

/**
 * Full Width Layout (No Sidebar, No Footer)
 * 
 * For pages that need maximum screen space
 * (e.g., Booking Flow, Checkout)
 */
export function FullWidthLayout({
  children,
  user,
  onLogout,
  contentClassName = '',
}: Omit<LayoutProps, 'config'> & { onLogout: () => void }) {
  return (
    <Layout
      user={user}
      onLogout={onLogout}
      config={{
        showSidebar: false,
        showFooter: false,
      }}
      contentClassName={contentClassName}
    >
      {children}
    </Layout>
  )
}

/**
 * Minimal Layout (Header Only)
 * 
 * For auth pages or landing pages
 */
export function MinimalLayout({
  children,
  user,
  onLogout,
}: Omit<LayoutProps, 'config' | 'contentClassName'> & { onLogout: () => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        user={user}
        navLinks={[]}
        onLogout={onLogout}
        showSidebarToggle={false}
        showNotifications={false}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
