// ==========================================
// COOKIE POLICY PAGE
// ==========================================

import { Metadata } from 'next'
import Link from 'next/link'
import { Cookie } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Cookie Policy | Hotel Booking',
  description: 'Information about how we use cookies on our website.',
}

export default function CookiesPage() {
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
          <Cookie className="h-16 w-16 mx-auto text-blue-600 mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Cookie Policy</h1>
          <p className="text-gray-600 dark:text-gray-400">Last updated: October 25, 2025</p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">What Are Cookies?</h2>
            <p className="text-gray-700 dark:text-gray-300">
              Cookies are small text files that are placed on your device when you visit our website. They help
              us provide you with a better experience by remembering your preferences and understanding how you
              use our site.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">How We Use Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">We use cookies for:</p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for the website to function properly</li>
              <li><strong>Authentication:</strong> To keep you logged in during your session</li>
              <li><strong>Preferences:</strong> To remember your settings and choices</li>
              <li><strong>Analytics:</strong> To understand how visitors use our site</li>
              <li><strong>Security:</strong> To protect against fraudulent activity</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Types of Cookies We Use</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Session Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Temporary cookies that expire when you close your browser.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Persistent Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Remain on your device for a set period or until you delete them.
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Third-Party Cookies</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  Set by third-party services like analytics providers.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Managing Cookies</h2>
            <p className="text-gray-700 dark:text-gray-300">
              You can control and manage cookies through your browser settings. Please note that disabling
              certain cookies may affect the functionality of our website.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contact Us</h2>
            <p className="text-gray-700 dark:text-gray-300">
              If you have questions about our use of cookies, please contact us at:
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
