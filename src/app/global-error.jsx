// Simplified global error page without client features
// This prevents build-time React context errors

export default function GlobalError() {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
      </body>
    </html>
  )
}
