// ==========================================
// LAZY-LOADED COMPONENTS INDEX
// ==========================================
// PERF: Heavy components are loaded only when needed
// This reduces initial bundle size significantly

'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'

// ==========================================
// LOADING SKELETONS
// ==========================================

const ModalSkeleton = () => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <Card className="w-full max-w-2xl mx-4">
      <CardContent className="p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  </div>
)

// ==========================================
// LAZY ADMIN MODALS
// ==========================================

export const LazyEnhancedBookingModal = dynamic(
  () => import('@/components/admin/EnhancedBookingManagementModal'),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
)

export const LazyOfflineBookingModal = dynamic(
  () => import('@/components/admin/OfflineBookingModal'),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
)

// ==========================================
// LAZY PROFILE MODALS
// ==========================================

export const LazyEditProfileModal = dynamic(
  () => import('@/components/profile/EditProfileModal').then(mod => ({ default: mod.EditProfileModal })),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
)

export const LazyLinkMembershipModal = dynamic(
  () => import('@/components/profile/LinkMembershipModal').then(mod => ({ default: mod.LinkMembershipModal })),
  { 
    loading: () => <ModalSkeleton />,
    ssr: false 
  }
)

// ==========================================
// LAZY CALENDAR COMPONENTS
// ==========================================

export const LazyEnhancedBookingCalendar = dynamic(
  () => import('@/components/Calendar/EnhancedBookingCalendar').then(mod => ({ default: mod.default })),
  { 
    loading: () => (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    ),
    ssr: false 
  }
)

export const LazyAccessibleBookingCalendar = dynamic(
  () => import('@/components/Calendar/AccessibleBookingCalendar').then(mod => ({ default: mod.default })),
  { 
    loading: () => (
      <Card className="p-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-64 w-full" />
      </Card>
    ),
    ssr: false 
  }
)

// ==========================================
// LAZY DATA TABLES
// ==========================================

export const LazyDataTable = dynamic(
  () => import('@/components/dashboard/DataTable').then(mod => ({ default: mod.DataTable })),
  { 
    loading: () => (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    ),
    ssr: false 
  }
)

// Re-export chart components
export { 
  LazyAreaChart, 
  LazyPieChart, 
  LazyBarChart, 
  LazyLineChart 
} from '@/components/charts/LazyCharts'
