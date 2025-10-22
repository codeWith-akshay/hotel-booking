/**
 * Tailwind CSS Test Page
 * Tests all major Tailwind utilities to verify configuration
 */

export default function TailwindTestPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            🎨 Tailwind CSS Test Page
          </h1>
          <p className="text-muted-foreground text-lg">
            If you see styled boxes below, Tailwind v4 is working perfectly!
          </p>
        </div>

        {/* Color Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            1. Color Utilities
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-red-500 text-white p-4 rounded-lg text-center">
              Red 500
            </div>
            <div className="bg-blue-500 text-white p-4 rounded-lg text-center">
              Blue 500
            </div>
            <div className="bg-green-500 text-white p-4 rounded-lg text-center">
              Green 500
            </div>
            <div className="bg-yellow-500 text-white p-4 rounded-lg text-center">
              Yellow 500
            </div>
          </div>
        </section>

        {/* Custom Theme Colors */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            2. Custom Theme Colors
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary text-primary-foreground p-4 rounded-lg text-center">
              Primary
            </div>
            <div className="bg-secondary text-secondary-foreground p-4 rounded-lg text-center">
              Secondary
            </div>
            <div className="bg-accent text-accent-foreground p-4 rounded-lg text-center">
              Accent
            </div>
            <div className="bg-destructive text-destructive-foreground p-4 rounded-lg text-center">
              Destructive
            </div>
          </div>
        </section>

        {/* Layout Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            3. Flexbox & Grid
          </h2>
          <div className="flex gap-4 items-center justify-between bg-card p-6 rounded-lg border border-border">
            <div className="flex-1 bg-primary/20 p-4 rounded text-center">
              Flex 1
            </div>
            <div className="flex-1 bg-secondary/20 p-4 rounded text-center">
              Flex 2
            </div>
            <div className="flex-1 bg-accent/20 p-4 rounded text-center">
              Flex 3
            </div>
          </div>
        </section>

        {/* Spacing Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            4. Spacing Utilities
          </h2>
          <div className="space-y-2">
            <div className="bg-muted p-2 rounded">Padding: p-2</div>
            <div className="bg-muted p-4 rounded">Padding: p-4</div>
            <div className="bg-muted p-6 rounded">Padding: p-6</div>
            <div className="bg-muted p-8 rounded">Padding: p-8</div>
          </div>
        </section>

        {/* Typography Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            5. Typography
          </h2>
          <div className="space-y-2 bg-card p-6 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">Extra Small (xs)</p>
            <p className="text-sm text-muted-foreground">Small (sm)</p>
            <p className="text-base text-foreground">Base</p>
            <p className="text-lg text-foreground">Large (lg)</p>
            <p className="text-xl text-foreground">Extra Large (xl)</p>
            <p className="text-2xl font-bold text-foreground">2XL Bold</p>
            <p className="text-3xl font-bold text-foreground">3XL Bold</p>
          </div>
        </section>

        {/* Border & Shadow Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            6. Borders & Shadows
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-card p-4 rounded-sm border border-border">
              Rounded SM
            </div>
            <div className="bg-card p-4 rounded-md border border-border">
              Rounded MD
            </div>
            <div className="bg-card p-4 rounded-lg border border-border">
              Rounded LG
            </div>
            <div className="bg-card p-4 rounded-lg shadow-sm border border-border">
              Shadow SM
            </div>
            <div className="bg-card p-4 rounded-lg shadow-md border border-border">
              Shadow MD
            </div>
            <div className="bg-card p-4 rounded-lg shadow-lg border border-border">
              Shadow LG
            </div>
          </div>
        </section>

        {/* Responsive Test */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            7. Responsive Design
          </h2>
          <div className="bg-card p-6 rounded-lg border border-border">
            <div className="text-center p-4 rounded-lg bg-red-500 text-white sm:bg-blue-500 md:bg-green-500 lg:bg-yellow-500 xl:bg-purple-500">
              <span className="block sm:hidden">Mobile (Red)</span>
              <span className="hidden sm:block md:hidden">SM (Blue)</span>
              <span className="hidden md:block lg:hidden">MD (Green)</span>
              <span className="hidden lg:block xl:hidden">LG (Yellow)</span>
              <span className="hidden xl:block">XL (Purple)</span>
            </div>
            <p className="text-center text-muted-foreground mt-4">
              Resize your browser window to test responsive breakpoints
            </p>
          </div>
        </section>

        {/* Interactive Elements */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            8. Interactive States
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-primary text-primary-foreground p-4 rounded-lg hover:bg-primary/90 transition-colors">
              Hover Me
            </button>
            <button className="bg-secondary text-secondary-foreground p-4 rounded-lg hover:bg-secondary/80 transition-colors">
              Hover Me
            </button>
            <button className="bg-accent text-accent-foreground p-4 rounded-lg hover:bg-accent/80 transition-colors">
              Hover Me
            </button>
            <button className="bg-destructive text-destructive-foreground p-4 rounded-lg hover:bg-destructive/90 transition-colors">
              Hover Me
            </button>
          </div>
        </section>

        {/* Status */}
        <section className="bg-green-500 text-white p-6 rounded-lg text-center">
          <h2 className="text-2xl font-bold">
            ✅ Tailwind CSS v4 is Working!
          </h2>
          <p className="mt-2">
            All styles are being applied correctly. You can now use Tailwind in
            your project.
          </p>
        </section>

        {/* Instructions */}
        <section className="bg-card p-6 rounded-lg border border-border space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            📚 Next Steps
          </h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              Delete this test page:{" "}
              <code className="bg-muted px-2 py-1 rounded text-foreground">
                src/app/tailwind-test/page.tsx
              </code>
            </li>
            <li>
              Start building your components with Tailwind utilities
            </li>
            <li>
              Use the{" "}
              <code className="bg-muted px-2 py-1 rounded text-foreground">
                cn()
              </code>{" "}
              utility for conditional classes
            </li>
            <li>
              Check{" "}
              <code className="bg-muted px-2 py-1 rounded text-foreground">
                docs/TAILWIND_DEBUG.md
              </code>{" "}
              for troubleshooting
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
