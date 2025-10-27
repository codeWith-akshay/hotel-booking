/**
 * Cache Statistics Script
 * 
 * Display cache performance metrics
 * 
 * Usage: pnpm run perf:cache-stats
 */

import { queryCache } from '../src/lib/cache/query-cache'

function displayCacheStats() {
  console.log('📊 Cache Performance Statistics\n')
  console.log('═'.repeat(50))
  
  const stats = queryCache.stats()
  
  console.log(`\n📦 Cache Size:`)
  console.log(`  Current: ${stats.size} / ${stats.maxSize} entries (${((stats.size / stats.maxSize) * 100).toFixed(1)}% full)`)
  
  console.log(`\n🎯 Cache Efficiency:`)
  console.log(`  Total Hits: ${stats.totalHits}`)
  console.log(`  Hit Rate: ${stats.hitRate.toFixed(2)} hits per entry`)
  console.log(`  Expired Entries: ${stats.expiredCount}`)
  
  // Performance indicators
  console.log(`\n📈 Performance Assessment:`)
  
  if (stats.hitRate > 5) {
    console.log(`  ✅ Excellent - High cache reuse (${stats.hitRate.toFixed(1)} hits/entry)`)
  } else if (stats.hitRate > 2) {
    console.log(`  ⚠️  Good - Moderate cache reuse (${stats.hitRate.toFixed(1)} hits/entry)`)
  } else if (stats.hitRate > 0) {
    console.log(`  ⚠️  Low - Consider increasing TTL (${stats.hitRate.toFixed(1)} hits/entry)`)
  } else {
    console.log(`  ❌ Very Low - Cache may not be effective`)
  }
  
  if (stats.size > stats.maxSize * 0.8) {
    console.log(`  ⚠️  Cache nearing capacity - consider increasing maxSize`)
  }
  
  if (stats.expiredCount > stats.size * 0.2) {
    console.log(`  ⚠️  Many expired entries - run cleanup`)
  }
  
  console.log('\n' + '═'.repeat(50))
  
  // Recommendations
  console.log(`\n💡 Recommendations:`)
  
  if (stats.hitRate < 2) {
    console.log(`  - Increase cache TTL for stable data`)
    console.log(`  - Verify cache keys are consistent across requests`)
    console.log(`  - Check if cache is being invalidated too frequently`)
  }
  
  if (stats.size > stats.maxSize * 0.8) {
    console.log(`  - Increase maxSize in cache configuration`)
    console.log(`  - Review cached data - remove unnecessary caching`)
  }
  
  if (stats.hitRate > 10) {
    console.log(`  - Great job! Cache is highly effective`)
  }
  
  console.log()
}

// Run cleanup and display stats
console.log('🧹 Cleaning up expired entries...')
const cleanedCount = queryCache.cleanup()
console.log(`✅ Cleaned ${cleanedCount} expired entries\n`)

displayCacheStats()

// Export for programmatic use
export { displayCacheStats }
