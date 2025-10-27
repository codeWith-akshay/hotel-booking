'use client'

// Global error boundary - must be a client component
// Kept minimal to avoid React context issues during build

import * as React from 'react'

export default function GlobalError({ error, reset }) {
  React.useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <title>Error</title>
      </head>
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong!</h2>
          <p style={{ marginBottom: '2rem', color: '#666' }}>
            {error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
            }}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Go Home
          </button>
        </div>
      </body>
    </html>
  )
}
