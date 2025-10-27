/**
 * Auth Module Exports
 * Central export point for authentication utilities
 */

export { 
  getCurrentUser, 
  requireAuth, 
  hasRole,
  type UserContext 
} from '../middleware/auth.utils'

export {
  requireAuth as requireAuthRBAC,
  requireRole,
  requireOwnerOrAdmin,
  type RBACContext
} from '../rbac'
