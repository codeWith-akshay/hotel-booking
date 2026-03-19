'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global Error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f9fafb',
          padding: '1rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{ maxWidth: '28rem', textAlign: 'center' }}>
            <div style={{
              width: '4rem',
              height: '4rem',
              backgroundColor: '#fef2f2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg
                style={{ width: '2rem', height: '2rem', color: '#dc2626' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: '700',
              color: '#111827',
              marginBottom: '0.5rem'
            }}>
              Application Error
            </h1>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem'
            }}>
              A critical error occurred. Please refresh the page.
            </p>
            <button
              onClick={() => reset()}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: '500',
                cursor: 'pointer',
                marginRight: '0.5rem'
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                backgroundColor: '#ffffff',
                color: '#374151',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #d1d5db',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
