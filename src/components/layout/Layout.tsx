// ==========================================
// MAIN LAYOUT COMPONENT
// ==========================================
// Combines Header, Sidebar, Footer with responsive grid
// Features: Mobile-first, collapsible sidebar, role-based navigation

'use client'

import { useState, useEffect } from 'react'
import Header, { type NavLink } from './Header'
import Sidebar, { type SidebarLink } from './Sidebar'
import Footer from './Footer'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export interface LayoutProps {
  /** Main content to render */
  children: React.ReactNode
  
  /** User information */
  user: {
    /** User's display name */
    name: string
    /** User's email or phone */
    email?: string
    /** User's role (MEMBER, ADMIN, SUPERADMIN) */
    role: string
    /** Avatar image URL */
    avatarUrl?: string
  }
  
  /** Layout configuration */
  config?: {
    /** Show/hide sidebar */
    showSidebar?: boolean
    /** Show/hide footer */
    showFooter?: boolean
    /** Custom header navigation links */
    headerNavLinks?: NavLink[]
    /** Custom sidebar links */
    sidebarLinks?: SidebarLink[]
    /** Company name for footer */
    companyName?: string
  }
  
  /** Callback when user logs out */
  onLogout?: () => void
  
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
  contentClassName = '',
}: LayoutProps) {
  const {
    showSidebar = true,
    showFooter = true,
    headerNavLinks,
    sidebarLinks,
    companyName,
  } = config

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
      <Header
        userName={user.name}
        userRole={user.role}
        {...(user.email && { userEmail: user.email })}
        {...(user.avatarUrl && { avatarUrl: user.avatarUrl })}
        {...(onLogout && { onLogout })}
        {...(headerNavLinks && { navLinks: headerNavLinks })}
        showSidebarToggle={showSidebar}
        onSidebarToggle={handleSidebarToggle}
      />

      {/* ==========================================
          MAIN LAYOUT: Sidebar + Content
      ========================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        {showSidebar && (
          <Sidebar
            userRole={user.role}
            {...(sidebarLinks && { links: sidebarLinks })}
            isOpen={sidebarOpen}
            onToggle={handleSidebarToggle}
            showOnDesktop={true}
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
}: Omit<LayoutProps, 'config'>) {
  return (
    <Layout
      user={user}
      {...(onLogout && { onLogout })}
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
}: Omit<LayoutProps, 'config'>) {
  return (
    <Layout
      user={user}
      {...(onLogout && { onLogout })}
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
}: Omit<LayoutProps, 'config' | 'contentClassName'>) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header
        userName={user.name}
        userRole={user.role}
        {...(user.email && { userEmail: user.email })}
        {...(user.avatarUrl && { avatarUrl: user.avatarUrl })}
        {...(onLogout && { onLogout })}
        showSidebarToggle={false}
      />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
