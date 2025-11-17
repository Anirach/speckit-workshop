/**
 * EXIF Metadata Extraction
 * Browser-compatible EXIF extraction from photos
 */

import ExifReader from 'exifreader'

/**
 * Extract metadata from photo file
 * @param {File} file - Browser File object
 * @returns {Promise<Object>} Metadata object
 */
export async function extractMetadata(file) {
  try {
    // ExifReader can work directly with File objects in the browser
    const tags = await ExifReader.load(file, { expanded: true })

    // Extract date with timezone
    const dateOriginal =
      tags.exif?.DateTimeOriginal?.description || tags.exif?.DateTime?.description
    const timezone = tags.exif?.OffsetTimeOriginal?.description

    // Extract dimensions
    const width = tags.file?.['Image Width']?.value || tags.exif?.PixelXDimension?.value
    const height = tags.file?.['Image Height']?.value || tags.exif?.PixelYDimension?.value

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
    console.warn(`EXIF extraction failed:`, error.message)
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
 * @param {File} file - Browser File object
 * @returns {Promise<boolean>} True if EXIF exists
 */
export async function hasExifData(file) {
  const metadata = await extractMetadata(file)
  return metadata.dateTaken !== null
}
