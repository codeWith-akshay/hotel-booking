'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard } from 'lucide-react'

export default function BookingPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const bookingId = params.id as string

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
              Payment
            </h1>
            <p className="text-gray-600 mt-2">Complete your booking payment</p>
          </div>

          {/* Coming Soon Message */}
          <Card className="border-0 shadow-xl">
            <CardContent className="py-20">
              <div className="text-center">
                <div className="flex justify-center mb-6">
                  <div className="p-4 bg-linear-to-br from-green-100 to-emerald-100 rounded-full">
                    <CreditCard className="h-12 w-12 text-green-600" />
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                  Online Payment Coming Soon
                </h3>
                <p className="text-gray-500 mb-6">
                  Online payment integration is under development. <br />
                  Please contact the hotel for payment options.
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
