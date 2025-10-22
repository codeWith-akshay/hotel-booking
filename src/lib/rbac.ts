import { RoleName } from '@prisma/client'

export interface UserWithRoles {
  id: string
  email: string
  firstName: string
  lastName: string
  roles: RoleName[]
}

export function hasRole(user: UserWithRoles, role: RoleName): boolean {
  return user.roles.includes(role)
}

export function hasAnyRole(user: UserWithRoles, roles: RoleName[]): boolean {
  return roles.some(role => user.roles.includes(role))
}

export function canAccessAdminPanel(user: UserWithRoles): boolean {
  return hasAnyRole(user, [RoleName.ADMIN, RoleName.SUPERADMIN])
}

export function canAccessSuperAdminPanel(user: UserWithRoles): boolean {
  return hasRole(user, RoleName.SUPERADMIN)
}

export function canManageBookings(user: UserWithRoles): boolean {
  return hasAnyRole(user, [RoleName.ADMIN, RoleName.SUPERADMIN])
}

export function canManageUsers(user: UserWithRoles): boolean {
  return hasRole(user, RoleName.SUPERADMIN)
}