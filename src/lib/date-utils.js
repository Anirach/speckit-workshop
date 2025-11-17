/**
 * Date Utilities
 * EXIF date parsing, timezone handling, ISO8601 conversion
 */

import { statSync } from 'fs'

/**
 * Convert EXIF date to ISO8601 format
 * @param {string} exifDate - EXIF date string (e.g., "2024:01:15 14:30:22")
 * @param {string|null} timezoneOffset - Timezone offset (e.g., "+08:00")
 * @returns {string} ISO8601 timestamp
 */
export function exifToISO(exifDate, timezoneOffset = null) {
  if (!exifDate) {
    return null
  }

  // EXIF format: "YYYY:MM:DD HH:MM:SS"
  // Convert to ISO: "YYYY-MM-DDTHH:MM:SS+TZ"
  const [datePart, timePart] = exifDate.split(' ')
  const isoDate = datePart.replace(/:/g, '-')

  if (timezoneOffset) {
    return `${isoDate}T${timePart}${timezoneOffset}`
  } else {
    // No timezone, assume local timezone
    const date = new Date(`${isoDate}T${timePart}`)
    return date.toISOString()
  }
}

/**
 * Parse ISO8601 date to year and month
 * @param {string} isoDate - ISO8601 date string
 * @returns {{year: number, month: number}} Year and month
 */
export function parseYearMonth(isoDate) {
  const date = new Date(isoDate)
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1 // Month is 0-indexed
  }
}

/**
 * Format year-month for directory name
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {string} Formatted year-month (e.g., "2024-01")
 */
export function formatYearMonth(year, month) {
  return `${year}-${String(month).padStart(2, '0')}`
}

/**
 * Format year-month for album title
 * @param {number} year - Year (e.g., 2024)
 * @param {number} month - Month (1-12)
 * @returns {string} Album title (e.g., "January 2024")
 */
export function formatAlbumTitle(year, month) {
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]
  return `${monthNames[month - 1]} ${year}`
}

/**
 * Get current timestamp in ISO8601 format
 * @returns {string} Current timestamp
 */
export function now() {
  return new Date().toISOString()
}

/**
 * Format date for display
 * @param {string} isoDate - ISO8601 date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2024")
 */
export function formatDisplayDate(isoDate) {
  const date = new Date(isoDate)
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]

  return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

/**
 * Get file modification time as ISO8601 (fallback for photos without EXIF)
 * @param {string} filePath - Absolute path to file
 * @returns {string} ISO8601 timestamp
 */
export function getFileModificationDate(filePath) {
  const stats = statSync(filePath)
  return stats.mtime.toISOString()
}
