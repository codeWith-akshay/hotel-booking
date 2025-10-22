// Re-export Prisma types for convenience
export type {
  User,
  Role,
  UserRole,
  Profile,
  Room,
  RoomInventory,
  Booking,
  Payment,
  Invoice,
  OTP,
  Rule,
  Notification,
  WaitlistEntry,
  AuditLog,
  BulkMessageJob,
  BulkMessageLog,
  SystemSetting,
} from '@prisma/client'

export type {
  RoleName,
  MembershipType,
  RoomType,
  BookingStatus,
  PaymentMethod,
  PaymentStatus,
  NotificationChannel,
  NotificationStatus,
  RuleType,
  BulkJobStatus,
} from '@prisma/client'

// Custom types
export interface UserWithRoles {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  userRoles: Array<{
    role: {
      name: string
    }
  }>
}

export interface BookingWithDetails {
  id: string
  checkInDate: Date
  checkOutDate: Date
  guests: number
  totalAmount: number
  status: string
  notes?: string | null
  createdAt: Date
  user: {
    firstName: string
    lastName: string
    email: string
  }
  room: {
    number: string
    type: string
    pricePerNight: number
  }
}

export interface RoomWithInventory {
  id: string
  number: string
  type: string
  capacity: number
  pricePerNight: number
  amenities?: any
  description?: string | null
  isActive: boolean
  inventory: Array<{
    date: Date
    available: boolean
    price?: number | null
  }>
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}