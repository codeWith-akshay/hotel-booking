'use client'

import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2>Page Not Found</h2>
      <p>Could not find the requested resource</p>
      <Link href="/" style={{ color: '#0070f3' }}>
        Return Home
      </Link>
    </div>
  )
}
