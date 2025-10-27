// ==========================================
// HOME PAGE - Landing Page
// ==========================================
// Main landing page for the hotel booking application

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import Link from 'next/link'
import { Building2, Calendar, Users, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const router = useRouter()
  const { isAuthenticated, user, _hasHydrated } = useAuthStore()

  useEffect(() => {
    // Wait for Zustand to rehydrate from localStorage
    if (!_hasHydrated) {
      return
    }

    // Redirect authenticated users to their appropriate dashboard
    if (isAuthenticated && user) {
      const role = user.role
      
      if (role === 'ADMIN' || role === 'SUPERADMIN') {
        router.push('/admin/dashboard')
      } else if (role === 'MEMBER') {
        router.push('/dashboard')
      }
    }
  }, [isAuthenticated, user, _hasHydrated, router])

  // Show loading while hydrating
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show landing page for non-authenticated users
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to
            <span className="block text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600 mt-2">
              Hotel Booking
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your perfect stay begins here. Book luxury rooms, manage reservations, and enjoy a seamless hospitality experience.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/rooms">
              <Button size="lg" className="w-full sm:w-auto">
                Browse Rooms
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Easy Booking
              </h3>
              <p className="text-gray-600 text-sm">
                Book your perfect room in just a few clicks with our intuitive booking system.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Member Benefits
              </h3>
              <p className="text-gray-600 text-sm">
                Join as a member to unlock exclusive deals and manage your bookings easily.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Secure & Safe
              </h3>
              <p className="text-gray-600 text-sm">
                Your data and payments are protected with industry-leading security measures.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-500 text-sm mb-4">Quick Links</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/rooms" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View Rooms
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/login" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Sign In
              </Link>
              <span className="text-gray-300">•</span>
              <Link href="/privacy" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
