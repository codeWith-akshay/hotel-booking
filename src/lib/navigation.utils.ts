// ==========================================
// NAVIGATION UTILITIES
// ==========================================
// Helper functions for role-based navigation and dynamic routing
// Features: Role filtering, active route detection, navigation generation

import type { NavLink } from '@/components/layout/Header'
import type { SidebarLink } from '@/components/layout/Sidebar'

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * User role types
 */
export type UserRole = 'MEMBER' | 'ADMIN' | 'SUPERADMIN'

/**
 * Navigation config for different roles
 */
export interface RoleNavigationConfig {
  role: UserRole
  headerLinks: NavLink[]
  sidebarLinks: () => SidebarLink[]
  allowedRoutes: string[]
}

// ==========================================
// DEFAULT NAVIGATION CONFIGS
// ==========================================

/**
 * MEMBER navigation configuration
 */
export const MEMBER_NAVIGATION: RoleNavigationConfig = {
  role: 'MEMBER',
  headerLinks: [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'My Bookings', href: '/booking', icon: '📅' },
    { label: 'Profile', href: '/profile', icon: '👤' },
  ],
  sidebarLinks: () => [
    {
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'My Bookings',
      href: '/booking',
      roles: ['MEMBER'],
      children: [
        { label: 'All Bookings', href: '/booking' },
        { label: 'New Booking', href: '/booking/new' },
      ],
    },
    {
      label: 'Profile',
      href: '/profile',
      roles: ['MEMBER', 'ADMIN', 'SUPERADMIN'],
    },
  ],
  allowedRoutes: ['/dashboard', '/booking', '/profile'],
}

/**
 * ADMIN navigation configuration
 */
export const ADMIN_NAVIGATION: RoleNavigationConfig = {
  role: 'ADMIN',
  headerLinks: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: '🏠' },
    { label: 'Bookings', href: '/admin/bookings', icon: '📅', badge: 5 },
    { label: 'Reports', href: '/admin/reports', icon: '📊' },
  ],
  sidebarLinks: () => [
    {
      label: 'Dashboard',
      href: '/admin/dashboard',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Bookings',
      href: '/admin/bookings',
      badge: 5,
      badgeVariant: 'warning',
      roles: ['ADMIN', 'SUPERADMIN'],
      children: [
        { label: 'All Bookings', href: '/admin/bookings' },
        { label: 'Pending', href: '/admin/bookings/pending', badge: 5, badgeVariant: 'warning' },
        { label: 'Today Check-ins', href: '/admin/bookings/checkins' },
        { label: 'Today Check-outs', href: '/admin/bookings/checkouts' },
      ],
    },
    {
      label: 'Rooms',
      href: '/admin/rooms',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Guests',
      href: '/admin/guests',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
    {
      label: 'Reports',
      href: '/admin/reports',
      roles: ['ADMIN', 'SUPERADMIN'],
    },
  ],
  allowedRoutes: ['/admin/dashboard', '/admin/bookings', '/admin/rooms', '/admin/guests', '/admin/reports'],
}

/**
 * SUPERADMIN navigation configuration
 */
export const SUPERADMIN_NAVIGATION: RoleNavigationConfig = {
  role: 'SUPERADMIN',
  headerLinks: [
    { label: 'Dashboard', href: '/superadmin/dashboard', icon: '🏠' },
    { label: 'Users', href: '/superadmin/users', icon: '👥' },
    { label: 'System', href: '/superadmin/system', icon: '⚙️' },
  ],
  sidebarLinks: () => [
    {
      label: 'Dashboard',
      href: '/superadmin/dashboard',
      roles: ['SUPERADMIN'],
    },
    {
      label: 'Users',
      href: '/superadmin/users',
      roles: ['SUPERADMIN'],
      children: [
        { label: 'All Users', href: '/superadmin/users' },
        { label: 'Admins', href: '/superadmin/users/admins' },
        { label: 'Members', href: '/superadmin/users/members' },
        { label: 'Roles & Permissions', href: '/superadmin/users/roles' },
      ],
    },
    {
      label: 'Communication',
      href: '/superadmin/communication',
      roles: ['SUPERADMIN'],
    },
    {
      label: 'Reports',
      href: '/superadmin/reports',
      roles: ['SUPERADMIN'],
    },
    {
      label: 'Rules',
      href: '/superadmin/rules',
      roles: ['SUPERADMIN'],
    },
    {
      label: 'System Settings',
      href: '/superadmin/system',
      roles: ['SUPERADMIN'],
    },
  ],
  allowedRoutes: ['/superadmin/dashboard', '/superadmin/users', '/superadmin/communication', '/superadmin/reports', '/superadmin/rules', '/superadmin/system'],
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Get navigation configuration for a specific role
 */
export function getNavigationForRole(role: UserRole): RoleNavigationConfig {
  switch (role) {
    case 'MEMBER':
      return MEMBER_NAVIGATION
    case 'ADMIN':
      return ADMIN_NAVIGATION
    case 'SUPERADMIN':
      return SUPERADMIN_NAVIGATION
    default:
      return MEMBER_NAVIGATION
  }
}

/**
 * Check if a route is allowed for a specific role
 */
export function isRouteAllowedForRole(route: string, role: UserRole): boolean {
  const config = getNavigationForRole(role)
  return config.allowedRoutes.some(
    (allowedRoute) => route === allowedRoute || route.startsWith(`${allowedRoute}/`)
  )
}

/**
 * Filter navigation links by role
 */
export function filterLinksByRole<T extends NavLink | SidebarLink>(
  links: T[],
  role: UserRole
): T[] {
  return links.filter((link) => {
    if (!link.roles || link.roles.length === 0) return true
    return link.roles.includes(role)
  })
}

/**
 * Check if current route matches link
 */
export function isLinkActive(linkHref: string, currentPath: string): boolean {
  if (linkHref === '/dashboard') {
    return currentPath === '/dashboard'
  }
  return currentPath.startsWith(linkHref)
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'MEMBER':
      return 'Member'
    case 'ADMIN':
      return 'Administrator'
    case 'SUPERADMIN':
      return 'Super Administrator'
    default:
      return role
  }
}

/**
 * Get role color for badges/UI
 */
export function getRoleColor(role: UserRole): string {
  switch (role) {
    case 'MEMBER':
      return 'green'
    case 'ADMIN':
      return 'blue'
    case 'SUPERADMIN':
      return 'purple'
    default:
      return 'gray'
  }
}
