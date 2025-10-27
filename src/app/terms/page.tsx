// ==========================================
// TERMS OF SERVICE PAGE
// ==========================================

import { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service | Hotel Booking',
  description: 'Terms and conditions for using our hotel booking services.',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            🏨 Hotel Booking
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 25, 2025</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Agreement to Terms</h2>
            <p className="text-gray-700 dark:text-gray-300">
              By accessing our website and services, you agree to be bound by these Terms of Service and all
              applicable laws and regulations. If you do not agree with any of these terms, you are prohibited
              from using this site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Booking Terms</h2>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>All bookings are subject to availability</li>
              <li>Advance payment may be required for certain bookings</li>
              <li>Cancellation policies vary by room type and season</li>
              <li>Check-in time: 3:00 PM | Check-out time: 11:00 AM</li>
              <li>Valid identification required at check-in</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Payment Terms</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Payment must be made in full at the time of booking or as specified in your reservation.
              We accept major credit cards and other payment methods as indicated on our site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cancellation Policy</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Cancellation policies vary depending on the rate and room type:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Standard Rate: Free cancellation up to 24 hours before check-in</li>
              <li>Non-Refundable Rate: No refunds for cancellations</li>
              <li>Peak Season: Cancellation fees may apply</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">User Conduct</h2>
            <p className="text-gray-700 dark:text-gray-300">
              You agree not to misuse our services or help anyone else do so. You must not attempt to gain
              unauthorized access to our systems or engage in any activity that disrupts or interferes with
              our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Limitation of Liability</h2>
            <p className="text-gray-700 dark:text-gray-300">
              We shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use of or inability to use the service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Information</h2>
            <p className="text-gray-700 dark:text-gray-300">
              For questions about these Terms, contact us at:
              <br />
              <a href="mailto:legal@hotelbooking.com" className="text-blue-600 hover:underline">
                legal@hotelbooking.com
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
