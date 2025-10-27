// ==========================================
// ABOUT PAGE
// ==========================================

import { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Users, Award, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About Us | Hotel Booking',
  description: 'Learn more about our hotel and commitment to exceptional hospitality.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              🏨 Hotel Booking
            </Link>
            <nav className="flex gap-6">
              <Link href="/rooms" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Rooms</Link>
              <Link href="/booking" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">Book</Link>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign In</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">About Our Hotel</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Welcome to our hotel booking platform. We are dedicated to providing exceptional accommodations
            and memorable experiences for all our guests.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <Building2 className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Premium Facilities</h3>
              <p className="text-gray-600 dark:text-gray-300">Modern amenities and comfortable spaces</p>
            </div>
            <div className="text-center">
              <Users className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Expert Staff</h3>
              <p className="text-gray-600 dark:text-gray-300">Dedicated team ready to serve</p>
            </div>
            <div className="text-center">
              <Award className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Award Winning</h3>
              <p className="text-gray-600 dark:text-gray-300">Recognized for excellence</p>
            </div>
            <div className="text-center">
              <Heart className="h-16 w-16 mx-auto text-blue-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Guest First</h3>
              <p className="text-gray-600 dark:text-gray-300">Your satisfaction is our priority</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Ready to Experience Our Hospitality?</h2>
          <Link href="/booking" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
            Book Your Stay
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Hotel Booking. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            <Link href="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
            <Link href="/terms" className="text-gray-400 hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
