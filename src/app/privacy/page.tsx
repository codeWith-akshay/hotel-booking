// ==========================================
// PRIVACY POLICY PAGE
// ==========================================

import { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy | Hotel Booking',
  description: 'Our privacy policy and how we handle your personal information.',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            🏨 Hotel Booking
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 25, 2025</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Welcome to Hotel Booking. We respect your privacy and are committed to protecting your personal data.
              This privacy policy will inform you about how we look after your personal data when you visit our
              website or use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Information We Collect</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">We may collect and process the following data:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Personal identification information (Name, phone number, email address)</li>
              <li>Booking and reservation details</li>
              <li>Payment information (processed securely through third-party providers)</li>
              <li>Communication records and preferences</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How We Use Your Information</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Process your bookings and reservations</li>
              <li>Send booking confirmations and updates</li>
              <li>Improve our services and customer experience</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Security</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We implement appropriate technical and organizational measures to ensure a level of security
              appropriate to the risk. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Rights</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have any questions about this privacy policy, please contact us at:
              <br />
              <a href="mailto:privacy@hotelbooking.com" className="text-blue-600 hover:underline">
                privacy@hotelbooking.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 text-center">
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
