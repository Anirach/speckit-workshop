/**
 * File Hash Calculation
 * SHA-256 hashing for duplicate detection
 */

import { createHash } from 'crypto'
import { createReadStream } from 'fs'

/**
 * Calculate SHA-256 hash of a file
 * @param {string} filePath - Absolute path to file
 * @returns {Promise<string>} 64-character hex hash
 */
export async function calculateFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(filePath)

    stream.on('data', (chunk) => {
      hash.update(chunk)
    })

    stream.on('end', () => {
      const hashHex = hash.digest('hex')
      resolve(hashHex)
    })

    stream.on('error', (error) => {
      reject(
        new Error(`Failed to calculate hash for ${filePath}: ${error.message}`)
      )
    })
  })
}

/**
 * Calculate hash for multiple files in parallel
 * @param {string[]} filePaths - Array of file paths
 * @returns {Promise<Map<string, string>>} Map of filePath -> hash
 */
export async function calculateMultipleHashes(filePaths) {
  const hashPromises = filePaths.map(async (path) => {
    const hash = await calculateFileHash(path)
    return [path, hash]
  })

  const results = await Promise.all(hashPromises)
  return new Map(results)
}
