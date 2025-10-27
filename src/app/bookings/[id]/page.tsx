'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Hotel,
  Calendar,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Download,
  Printer,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

export default function BookingDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const bookingId = params.id as string

  useEffect(() => {
    // TODO: Fetch booking details
    setLoading(false)
  }, [bookingId])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50/30 to-purple-50/20">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
            <h1 className="text-4xl font-bold bg-linear-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              Booking Details
            </h1>
            <p className="text-gray-600 mt-2">View your booking information</p>
          </div>

          {/* Coming Soon Message */}
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-linear-to-br from-blue-100 to-purple-100 rounded-full">
                    <Hotel className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Booking Details Coming Soon
                </h3>
                <p className="text-gray-500 mb-6">
                  Full booking details view is under development. <br />
                  You can view your bookings list for now.
                </p>
                <Button
                  onClick={() => router.push('/bookings/my-bookings')}
                  className="bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 h-auto"
                >
                  View All Bookings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
