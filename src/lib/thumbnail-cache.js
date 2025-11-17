/**
 * Thumbnail Cache System
 * Implements LRU (Least Recently Used) eviction and preloading for optimal performance
 */

class ThumbnailCache {
  constructor(maxSize = 100, preloadCount = 20) {
    this.maxSize = maxSize // Maximum number of cached thumbnails
    this.preloadCount = preloadCount // Number of thumbnails to preload ahead
    this.cache = new Map() // LRU cache: key -> { url, timestamp, references }
    this.accessOrder = [] // Track access order for LRU eviction
    this.preloadQueue = new Set() // Queue of thumbnail hashes to preload
    this.loading = new Set() // Currently loading thumbnails
  }

  /**
   * Get thumbnail from cache or load it
   * @param {string} hash - Photo hash
   * @param {Function} loader - Async function to load thumbnail if not cached
   * @returns {Promise<string>} Thumbnail URL
   */
  async get(hash, loader) {
    // Check cache first
    if (this.cache.has(hash)) {
      this.updateAccessOrder(hash)
      const cached = this.cache.get(hash)
      cached.references++
      return cached.url
    }

    // Load thumbnail
    if (!this.loading.has(hash)) {
      this.loading.add(hash)

      try {
        const blob = await loader(hash)
        const url = URL.createObjectURL(blob)

        this.set(hash, url)
        return url
      } finally {
        this.loading.delete(hash)
      }
    } else {
      // Wait for ongoing load
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (this.cache.has(hash)) {
            clearInterval(interval)
            this.updateAccessOrder(hash)
            resolve(this.cache.get(hash).url)
          }
        }, 50)
      })
    }
  }

  /**
   * Set thumbnail in cache
   * @param {string} hash - Photo hash
   * @param {string} url - Thumbnail URL
   */
  set(hash, url) {
    // Evict if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    this.cache.set(hash, {
      url,
      timestamp: Date.now(),
      references: 1
    })

    this.accessOrder.push(hash)
  }

  /**
   * Preload thumbnails for better UX
   * @param {Array<string>} hashes - Array of photo hashes to preload
   * @param {Function} loader - Async function to load thumbnails
   * @param {number} startIndex - Index to start preloading from
   */
  async preload(hashes, loader, startIndex = 0) {
    const endIndex = Math.min(startIndex + this.preloadCount, hashes.length)

    for (let i = startIndex; i < endIndex; i++) {
      const hash = hashes[i]

      // Skip if already cached or loading
      if (this.cache.has(hash) || this.loading.has(hash)) {
        continue
      }

      // Preload in background
      this.preloadQueue.add(hash)

      // Don't await - let it load in background
      this.get(hash, loader).catch(err => {
        console.warn(`Preload failed for ${hash}:`, err)
      })
    }
  }

  /**
   * Evict least recently used thumbnail
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return

    // Find LRU with zero references
    let evictHash = null

    for (const hash of this.accessOrder) {
      const cached = this.cache.get(hash)

      if (cached && cached.references === 0) {
        evictHash = hash
        break
      }
    }

    // If all have references, evict the oldest anyway
    if (!evictHash && this.accessOrder.length > 0) {
      evictHash = this.accessOrder[0]
    }

    if (evictHash) {
      this.evict(evictHash)
    }
  }

  /**
   * Evict specific thumbnail from cache
   * @param {string} photoHash - Photo hash to evict
   */
  evict(photoHash) {
    const cached = this.cache.get(photoHash)

    if (cached) {
      // Revoke object URL to free memory
      URL.revokeObjectURL(cached.url)
      this.cache.delete(photoHash)

      // Remove from access order
      const index = this.accessOrder.indexOf(photoHash)
      if (index !== -1) {
        this.accessOrder.splice(index, 1)
      }

      this.preloadQueue.delete(photoHash)
    }
  }

  /**
   * Update access order for LRU tracking
   * @param {string} hash - Photo hash
   */
  updateAccessOrder(hash) {
    const index = this.accessOrder.indexOf(hash)

    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }

    this.accessOrder.push(hash)
  }

  /**
   * Release reference to cached thumbnail
   * @param {string} hash - Photo hash
   */
  release(hash) {
    const cached = this.cache.get(hash)

    if (cached && cached.references > 0) {
      cached.references--
    }
  }

  /**
   * Clear all cached thumbnails
   */
  clear() {
    for (const [, cached] of this.cache.entries()) {
      URL.revokeObjectURL(cached.url)
    }

    this.cache.clear()
    this.accessOrder = []
    this.preloadQueue.clear()
    this.loading.clear()
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage(),
      preloadQueueSize: this.preloadQueue.size,
      loadingCount: this.loading.size
    }
  }

  /**
   * Calculate cache hit rate
   * @returns {number} Hit rate percentage
   */
  calculateHitRate() {
    // Simplified: based on cache size vs max size
    return this.cache.size > 0 ? Math.round((this.cache.size / this.maxSize) * 100) : 0
  }

  /**
   * Estimate memory usage (rough approximation)
   * @returns {string} Memory usage in MB
   */
  estimateMemoryUsage() {
    // Assume ~30KB average per thumbnail (300x300 JPEG at 0.85 quality)
    const avgThumbnailSize = 30 * 1024
    const totalBytes = this.cache.size * avgThumbnailSize
    const megabytes = (totalBytes / (1024 * 1024)).toFixed(2)

    return `${megabytes} MB`
  }
}

// Singleton instance
let instance = null

/**
 * Get singleton thumbnail cache instance
 * @param {number} maxSize - Maximum cache size
 * @param {number} preloadCount - Number of items to preload
 * @returns {ThumbnailCache} Cache instance
 */
export function getThumbnailCache(maxSize = 100, preloadCount = 20) {
  if (!instance) {
    instance = new ThumbnailCache(maxSize, preloadCount)
  }

  return instance
}

/**
 * Reset thumbnail cache (for testing)
 */
export function resetThumbnailCache() {
  if (instance) {
    instance.clear()
  }
  instance = null
}

export default ThumbnailCache
