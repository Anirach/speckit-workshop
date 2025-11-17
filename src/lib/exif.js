/**
 * EXIF Metadata Extraction
 * Extracts date, timezone, and camera info from photos
 */

import ExifReader from 'exifreader'
import { readFileSync } from 'fs'

/**
 * Extract metadata from photo file
 * @param {string} filePath - Absolute path to photo
 * @returns {Promise<Object>} Metadata object
 */
export async function extractMetadata(filePath) {
  try {
    const buffer = readFileSync(filePath)
    const tags = ExifReader.load(buffer, { expanded: true })

    // Extract date with timezone
    const dateOriginal =
      tags.exif?.DateTimeOriginal?.description ||
      tags.exif?.DateTime?.description
    const timezone = tags.exif?.OffsetTimeOriginal?.description

    // Extract dimensions
    const width =
      tags.file?.['Image Width']?.value || tags.exif?.PixelXDimension?.value
    const height =
      tags.file?.['Image Height']?.value || tags.exif?.PixelYDimension?.value

    // Extract camera info
    const cameraModel = tags.exif?.Model?.description

    return {
      dateTaken: dateOriginal || null,
      timezoneOffset: timezone || null,
      width: width || null,
      height: height || null,
      cameraModel: cameraModel || null
    }
  } catch (error) {
    // If EXIF extraction fails, return minimal metadata
    console.warn(`EXIF extraction failed for ${filePath}:`, error.message)
    return {
      dateTaken: null,
      timezoneOffset: null,
      width: null,
      height: null,
      cameraModel: null
    }
  }
}

/**
 * Check if file has valid EXIF metadata
 * @param {string} filePath - Absolute path to photo
 * @returns {Promise<boolean>} True if EXIF exists
 */
export async function hasExifData(filePath) {
  const metadata = await extractMetadata(filePath)
  return metadata.dateTaken !== null
}
