// ==========================================
// SIDEBAR COMPONENT
// ==========================================
// Collapsible sidebar with role-based navigation
// Features: Mobile drawer, desktop collapsible, hierarchical menu

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Sidebar navigation link interface
 */
export interface SidebarLink {
  /** Link label */
  label: string
  /** Link destination */
  href: string
  /** Optional icon (React node or emoji) */
  icon?: React.ReactNode
  /** Which roles can see this link */
  roles?: string[]
  /** Submenu items (hierarchical) */
  children?: SidebarLink[]
  /** Optional badge text or count */
  badge?: string | number
  /** Badge color variant */
  badgeVariant?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  /** Whether link should open in new tab */
  external?: boolean
  /** Custom CSS classes */
  className?: string
}

/**
 * Sidebar component props
 */
export interface SidebarProps {
  /** Sidebar navigation links */
  links: SidebarLink[]
  
  /** Currently active route path */
  activeRoute: string
  
  /** Current user's role (MEMBER, ADMIN, SUPERADMIN) */
  userRole: string
  
  /** Controlled open/closed state */
  isOpen?: boolean
  
  /** Callback when sidebar state changes */
  onToggle?: (open: boolean) => void
  
  /** Show sidebar (desktop) */
  showOnDesktop?: boolean
  
  /** Callback when link is clicked */
  onLinkClick?: (link: SidebarLink) => void
  
  /** Show/hide version footer */
  showFooter?: boolean
  
  /** Custom footer content */
  footerContent?: React.ReactNode
  
  /** Compact mode (icons only by default) */
  compact?: boolean
  
  /** Custom width when open */
  width?: string
  
  /** Custom width when collapsed */
  collapsedWidth?: string
}

// ==========================================
// DEFAULT SIDEBAR LINKS (HIERARCHICAL)
// ==========================================

const DEFAULT_SIDEBAR_LINKS: SidebarLink[] = [
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
    href: '/profile',
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
    children: [
      { label: 'My Bookings', href: '/bookings/my-bookings', roles: ['MEMBER'] },
      { label: 'New Booking', href: '/bookings/new', roles: ['MEMBER', 'ADMIN'] },
      { label: 'All Bookings', href: '/bookings', roles: ['ADMIN'] },
    ],
  },
  {
    label: 'Reports',
    href: '/reports',
    roles: ['ADMIN', 'SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    label: 'Communication',
    href: '/communication',
    roles: ['SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
    ),
  },
  {
    label: 'Rules',
    href: '/rules',
    roles: ['SUPERADMIN'],
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
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
// SIDEBAR COMPONENT
// ==========================================

/**
 * Sidebar Component
 * 
 * Collapsible sidebar with:
 * - Role-based navigation filtering
 * - Hierarchical menu with submenus
 * - Active link highlighting based on activeRoute
 * - Badge support for notifications/counts
 * - Mobile drawer functionality
 * - Desktop collapsible sidebar
 * - Dynamic rendering based on userRole
 * 
 * @example
 * ```tsx
 * <Sidebar
 *   links={navigationLinks}
 *   activeRoute="/dashboard"
 *   userRole="MEMBER"
 *   isOpen={sidebarOpen}
 *   onToggle={setSidebarOpen}
 * />
 * ```
 */
export default function Sidebar({
  links,
  activeRoute,
  userRole,
  isOpen = true,
  onToggle,
  showOnDesktop = true,
  onLinkClick,
  showFooter = true,
  footerContent,
  compact = false,
  width = 'w-64',
  collapsedWidth = 'w-20',
}: SidebarProps) {
  const pathname = usePathname()
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])

  // Use activeRoute prop or fallback to pathname
  const currentRoute = activeRoute || pathname

  // ==========================================
  // FILTER LINKS BY ROLE
  // ==========================================
  const filterLinksByRole = (linkList: SidebarLink[]): SidebarLink[] => {
    return linkList
      .filter((link) => !link.roles || link.roles.includes(userRole))
      .map((link) => {
        const filtered: SidebarLink = {
          ...link,
        }
        if (link.children) {
          filtered.children = filterLinksByRole(link.children)
        }
        return filtered
      })
  }

  const visibleLinks = filterLinksByRole(links)

  // ==========================================
  // CHECK IF LINK IS ACTIVE
  // ==========================================
  const isLinkActive = (href: string): boolean => {
    if (href === '/dashboard') {
      return currentRoute === '/dashboard'
    }
    return currentRoute.startsWith(href)
  }

  // ==========================================
  // GET BADGE COLORS
  // ==========================================
  const getBadgeColors = (variant: string = 'primary'): string => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white'
      case 'warning':
        return 'bg-yellow-500 text-white'
      case 'danger':
        return 'bg-red-500 text-white'
      case 'info':
        return 'bg-blue-500 text-white'
      case 'primary':
      default:
        return 'bg-blue-600 text-white'
    }
  }

  // ==========================================
  // TOGGLE SUBMENU
  // ==========================================
  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label]
    )
  }

  // ==========================================
  // HANDLE LINK CLICK
  // ==========================================
  const handleLinkClick = (link: SidebarLink, e: React.MouseEvent) => {
    // Close mobile sidebar on link click
    if (window.innerWidth < 1024) {
      onToggle?.(false)
    }

    // Custom callback
    if (onLinkClick) {
      onLinkClick(link)
    }
  }

  // ==========================================
  // RENDER SIDEBAR LINK
  // ==========================================
  const renderLink = (link: SidebarLink, level = 0) => {
    const hasChildren = link.children && link.children.length > 0
    const isExpanded = expandedMenus.includes(link.label)
    const isActive = isLinkActive(link.href)

    const linkElement = (
      <Link
        href={link.href}
        target={link.external ? '_blank' : undefined}
        rel={link.external ? 'noopener noreferrer' : undefined}
        onClick={(e) => handleLinkClick(link, e)}
        className={`
          flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all duration-200
          ${level > 0 ? 'pl-12 ml-2' : ''}
          ${
            isActive
              ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm'
          }
          ${link.className || ''}
          focus-ring touch-target
        `}
        aria-current={isActive ? 'page' : undefined}
        aria-label={link.external ? `${link.label} (opens in new tab)` : link.label}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Icon */}
          {link.icon && (
            <span className={`shrink-0 ${isActive ? 'text-blue-700' : 'text-gray-500'}`} aria-hidden="true">
              {link.icon}
            </span>
          )}

          {/* Label (show only when sidebar is open or not compact) */}
          {(isOpen || !compact) && (
            <span className="truncate text-sm flex-1">{link.label}</span>
          )}

          {/* Badge */}
          {link.badge && (isOpen || !compact) && (
            <span
              className={`
                ml-auto px-2 py-1 text-xs font-semibold rounded-full shrink-0 shadow-sm
                ${getBadgeColors(link.badgeVariant || 'primary')}
              `}
              aria-label={`${link.badge} items`}
            >
              {link.badge}
            </span>
          )}

          {/* External link icon */}
          {link.external && (isOpen || !compact) && (
            <svg
              className="w-3 h-3 shrink-0 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          )}
        </div>

        {/* Submenu Arrow */}
        {hasChildren && (isOpen || !compact) && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              toggleSubmenu(link.label)
            }}
            className="p-1 hover:bg-gray-200 rounded-lg transition-all duration-200 shrink-0 focus-ring"
            aria-label={isExpanded ? `Collapse ${link.label} submenu` : `Expand ${link.label} submenu`}
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        )}
      </Link>
    )

    return (
      <div key={link.href}>
        {/* Main Link */}
        <div className="relative">
          {linkElement}

          {/* Active indicator */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full shadow-lg" aria-hidden="true" />
          )}
        </div>

        {/* Submenu (Children) */}
        {hasChildren && isExpanded && (isOpen || !compact) && (
          <div className="mt-1 space-y-1 animate-fade-in-up">
            {link.children!.map((child) => renderLink(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* ==========================================
          MOBILE BACKDROP (when sidebar is open)
      ========================================== */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
          onClick={() => onToggle?.(false)}
          aria-hidden="true"
        />
      )}

      {/* ==========================================
          SIDEBAR
      ========================================== */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-white border-r border-gray-200 z-50
          transition-all duration-300 ease-in-out shadow-lg lg:shadow-none
          ${isOpen ? width : `w-0 lg:${collapsedWidth}`}
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${showOnDesktop ? '' : 'hidden'}
        `}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* ==========================================
              SIDEBAR HEADER
          ========================================== */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-linear-to-r from-gray-50 to-white">
            {(isOpen || !compact) && (
              <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
            )}

            {/* Close button (mobile) / Collapse button (desktop) */}
            <button
              onClick={() => onToggle?.(!isOpen)}
              className={`
                p-2 rounded-lg hover:bg-gray-100 focus-ring transition-all duration-200 touch-target
                ${(isOpen || !compact) ? '' : 'mx-auto'}
              `}
              aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              aria-expanded={isOpen}
            >
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                {isOpen ? (
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
          </div>

          {/* ==========================================
              NAVIGATION LINKS
          ========================================== */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {visibleLinks.length > 0 ? (
              visibleLinks.map((link) => renderLink(link))
            ) : (
              <div className="text-center text-gray-500 text-sm py-8">
                No links available for {userRole} role
              </div>
            )}
          </nav>

          {/* ==========================================
              SIDEBAR FOOTER (Optional)
          ========================================== */}
          {showFooter && (isOpen || !compact) && (
            <div className="p-4 border-t border-gray-200">
              {footerContent || (
                <div className="text-xs text-gray-500 text-center">
                  <p>Hotel Booking System</p>
                  <p className="mt-1">v1.0.0</p>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
