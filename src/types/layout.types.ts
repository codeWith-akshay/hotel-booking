// ==========================================
// LAYOUT TYPES AND UTILITIES
// ==========================================
// Centralized type definitions and helper functions for layouts
// Provides type safety and utility functions across layout components

// ==========================================
// USER TYPES
// ==========================================

/**
 * User role enumeration
 */
export type UserRole = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

/**
 * User information for layout
 */
export interface User {
  id: string
  name: string
  email?: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  ircaMembershipId?: string | null
}

// ==========================================
// NAVIGATION TYPES
// ==========================================

/**
 * Navigation link for header/sidebar
 */
export interface NavigationLink {
  label: string
  href: string
  icon?: React.ReactNode
  roles?: UserRole[]
  badge?: string | number // For notifications/counts
  children?: NavigationLink[]
}

/**
 * Navigation group (for organizing sidebar links)
 */
export interface NavigationGroup {
  title: string
  links: NavigationLink[]
  roles?: UserRole[]
}

// ==========================================
// LAYOUT CONFIGURATION TYPES
// ==========================================

/**
 * Layout configuration options
 */
export interface LayoutConfig {
  /** Show/hide sidebar */
  showSidebar?: boolean
  /** Show/hide footer */
  showFooter?: boolean
  /** Custom header navigation links */
  headerNavLinks?: NavigationLink[]
  /** Custom sidebar links */
  sidebarLinks?: NavigationLink[]
  /** Sidebar link groups */
  sidebarGroups?: NavigationGroup[]
  /** Company name for branding */
  companyName?: string
  /** Show social media links in footer */
  showSocialLinks?: boolean
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Filter navigation links based on user role
 * 
 * @param links - Array of navigation links
 * @param userRole - Current user's role
 * @returns Filtered array of links visible to the user
 * 
 * @example
 * ```typescript
 * const visibleLinks = filterLinksByRole(allLinks, 'MEMBER')
 * ```
 */
export function filterLinksByRole(
  links: NavigationLink[],
  userRole: UserRole
): NavigationLink[] {
  return links
    .filter((link) => !link.roles || link.roles.includes(userRole))
    .map((link) => {
      const filtered: NavigationLink = { ...link }
      if (link.children) {
        filtered.children = filterLinksByRole(link.children, userRole)
      }
      return filtered
    })
}

/**
 * Filter navigation groups based on user role
 * 
 * @param groups - Array of navigation groups
 * @param userRole - Current user's role
 * @returns Filtered array of groups visible to the user
 */
export function filterGroupsByRole(
  groups: NavigationGroup[],
  userRole: UserRole
): NavigationGroup[] {
  return groups
    .filter((group) => !group.roles || group.roles.includes(userRole))
    .map((group) => ({
      ...group,
      links: filterLinksByRole(group.links, userRole),
    }))
    .filter((group) => group.links.length > 0) // Remove empty groups
}

/**
 * Check if a link is active based on current pathname
 * 
 * @param href - Link href to check
 * @param pathname - Current page pathname
 * @param exact - Whether to match exactly or use startsWith
 * @returns True if link is active
 * 
 * @example
 * ```typescript
 * const active = isLinkActive('/dashboard', pathname)
 * ```
 */
export function isLinkActive(
  href: string,
  pathname: string,
  exact = false
): boolean {
  if (exact) {
    return pathname === href
  }
  
  // Special case for dashboard/home
  if (href === '/dashboard' || href === '/') {
    return pathname === href
  }
  
  return pathname.startsWith(href)
}

/**
 * Get user initials from name
 * 
 * @param name - User's full name
 * @param maxLength - Maximum number of initials (default: 2)
 * @returns User initials in uppercase
 * 
 * @example
 * ```typescript
 * getUserInitials('John Doe') // returns 'JD'
 * getUserInitials('Jane Smith Johnson', 3) // returns 'JSJ'
 * ```
 */
export function getUserInitials(name: string, maxLength = 2): string {
  return name
    .split(' ')
    .filter((n) => n.length > 0)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength)
}

/**
 * Get role badge styling
 * 
 * @param role - User role
 * @returns Tailwind CSS classes for role badge
 * 
 * @example
 * ```typescript
 * const badgeClasses = getRoleBadgeClasses('ADMIN')
 * ```
 */
export function getRoleBadgeClasses(role: UserRole): string {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
  
  const roleColors: Record<UserRole, string> = {
    SUPERADMIN: 'bg-purple-100 text-purple-800',
    ADMIN: 'bg-blue-100 text-blue-800',
    MEMBER: 'bg-green-100 text-green-800',
  }
  
  return `${baseClasses} ${roleColors[role]}`
}

/**
 * Get role display name
 * 
 * @param role - User role
 * @returns Formatted role name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    SUPERADMIN: 'Super Admin',
    ADMIN: 'Admin',
    MEMBER: 'Member',
  }
  
  return displayNames[role]
}

/**
 * Format user display name
 * Handles cases where name might be missing or malformed
 * 
 * @param user - User object
 * @returns Formatted display name
 */
export function formatUserDisplayName(user: Partial<User>): string {
  if (user.name && user.name.trim()) {
    return user.name.trim()
  }
  
  if (user.email) {
    const trimmedEmail = user.email.trim()
    if (trimmedEmail) {
      return trimmedEmail.split('@')[0]
    }
  }
  
  if (user.phone) {
    const trimmedPhone = user.phone.trim()
    if (trimmedPhone) {
      return `User ${trimmedPhone.slice(-4)}`
    }
  }
  
  return 'User'
}

// ==========================================
// DEFAULT NAVIGATION CONFIGURATIONS
// ==========================================

/**
 * Default navigation links for all roles
 * Note: Icons should be added in the component using these configs
 */
export const DEFAULT_NAVIGATION_LINKS: NavigationLink[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    label: 'Profile',
    href: '/profile',
    roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
  },
  {
    label: 'Bookings',
    href: '/bookings',
    roles: ['MEMBER', 'ADMIN'],
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
  },
  {
    label: 'Communication',
    href: '/communication',
    roles: ['SUPERADMIN'],
  },
  {
    label: 'Rules',
    href: '/rules',
    roles: ['SUPERADMIN'],
  },
  {
    label: 'Settings',
    href: '/settings',
    roles: ['SUPERADMIN'],
  },
]

/**
 * Default navigation groups for sidebar
 */
export const DEFAULT_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: 'Main',
    links: [
      {
        label: 'Dashboard',
        href: '/dashboard',
        roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
      },
      {
        label: 'Profile',
        href: '/profile',
        roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
      },
    ],
  },
  {
    title: 'Bookings',
    roles: ['MEMBER', 'ADMIN'],
    links: [
      { label: 'My Bookings', href: '/bookings/my-bookings', roles: ['MEMBER'] },
      { label: 'New Booking', href: '/bookings/new', roles: ['MEMBER', 'ADMIN'] },
      { label: 'All Bookings', href: '/bookings', roles: ['ADMIN'] },
    ],
  },
  {
    title: 'Administration',
    roles: ['ADMIN', 'SUPERADMIN'],
    links: [
      { label: 'Reports', href: '/reports', roles: ['ADMIN', 'SUPERADMIN'] },
      { label: 'Communication', href: '/communication', roles: ['SUPERADMIN'] },
      { label: 'Rules', href: '/rules', roles: ['SUPERADMIN'] },
      { label: 'Settings', href: '/settings', roles: ['SUPERADMIN'] },
    ],
  },
]

// ==========================================
// RESPONSIVE BREAKPOINTS
// ==========================================

/**
 * Tailwind breakpoints for responsive design
 */
export const BREAKPOINTS = {
  sm: 640,   // Small devices (phones, 640px and up)
  md: 768,   // Medium devices (tablets, 768px and up)
  lg: 1024,  // Large devices (desktops, 1024px and up)
  xl: 1280,  // Extra large devices (large desktops, 1280px and up)
  '2xl': 1536, // 2X large devices (larger desktops, 1536px and up)
} as const

/**
 * Check if current viewport is mobile
 */
export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < BREAKPOINTS.lg
}

/**
 * Check if current viewport is tablet
 */
export function isTabletViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= BREAKPOINTS.md && window.innerWidth < BREAKPOINTS.lg
}

/**
 * Check if current viewport is desktop
 */
export function isDesktopViewport(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= BREAKPOINTS.lg
}
