/**
 * File Hash Calculation
 * Browser-compatible SHA-256 hashing for duplicate detection
 */

/**
 * Calculate SHA-256 hash of a file
 * @param {File} file - Browser File object
 * @returns {Promise<string>} 64-character hex hash
 */
export async function calculateFileHash(file) {
  try {
    // Read file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    
    // Calculate SHA-256 hash using Web Crypto API
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer)
    
    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    
    return hashHex
  } catch (error) {
    throw new Error(`Failed to calculate hash: ${error.message}`)
  }
}

/**
 * Calculate hash for multiple files in parallel
 * @param {File[]} files - Array of File objects
 * @returns {Promise<Map<string, string>>} Map of fileName -> hash
 */
export async function calculateMultipleHashes(files) {
  const hashPromises = files.map(async file => {
    const hash = await calculateFileHash(file)
    return [file.name, hash]
  })

  const results = await Promise.all(hashPromises)
  return new Map(results)
}
