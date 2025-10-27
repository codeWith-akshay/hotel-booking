// ==========================================
// CONTACT PAGE
// ==========================================

import { Metadata } from 'next'
import Link from 'next/link'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us | Hotel Booking',
  description: 'Get in touch with us. We are here to help with your booking inquiries.',
}

export default function ContactPage() {
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
              <Link href="/about" className="text-gray-600 dark:text-gray-300 hover:text-blue-600">About</Link>
              <Link href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign In</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">Contact Us</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Have questions? We would love to hear from you.
          </p>
        </div>
      </section>

      {/* Contact Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
              <Mail className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Email</h3>
              <a href="mailto:support@hotelbooking.com" className="text-blue-600 hover:underline">
                support@hotelbooking.com
              </a>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
              <Phone className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Phone</h3>
              <a href="tel:+1234567890" className="text-blue-600 hover:underline">
                +1 (234) 567-890
              </a>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
              <MapPin className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Address</h3>
              <p className="text-gray-600 dark:text-gray-300">
                123 Hotel Street<br />City, State 12345
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center">
              <Clock className="h-12 w-12 mx-auto text-blue-600 mb-4" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">Hours</h3>
              <p className="text-gray-600 dark:text-gray-300">
                24/7 Support<br />Always Available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 px-4 bg-white dark:bg-gray-800">
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Send Us a Message</h2>
          <form className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-white"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">Message</label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-600 dark:bg-gray-700 dark:text-white"
                placeholder="Your message..."
              />
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© {new Date().getFullYear()} Hotel Booking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
