/**
 * Error Handling Utilities
 * User-friendly error messages (Principle III: UX Consistency)
 */

/**
 * Custom error classes for different error types
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.originalError = originalError
    this.userMessage = message
  }
}

export class FileNotFoundError extends Error {
  constructor(filePath) {
    super(`File not found: ${filePath}`)
    this.name = 'FileNotFoundError'
    this.userMessage = 'The file could not be found. Please check that it exists and try again.'
  }
}

export class UnsupportedFormatError extends Error {
  constructor(fileName) {
    super(`Unsupported file format: ${fileName}`)
    this.name = 'UnsupportedFormatError'
    this.userMessage =
      'This file format is not supported. Supported formats: JPEG, PNG, HEIC, HEIF.'
  }
}

export class DiskSpaceError extends Error {
  constructor(requiredBytes) {
    super(`Insufficient disk space: ${requiredBytes} bytes required`)
    this.name = 'DiskSpaceError'
    this.userMessage = 'Not enough disk space. Please free up space and try again.'
  }
}

export class PermissionError extends Error {
  constructor(operation, path) {
    super(`Permission denied: ${operation} on ${path}`)
    this.name = 'PermissionError'
    this.userMessage = 'Permission denied. Please check file permissions and try again.'
  }
}

export class DatabaseError extends Error {
  constructor(message) {
    super(message)
    this.name = 'DatabaseError'
    this.userMessage = 'A database error occurred. Please try again.'
  }
}

/**
 * Format error for user display
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function formatErrorMessage(error) {
  // Check if error has a custom user message
  if (error.userMessage) {
    return error.userMessage
  }

  // Default error messages based on error type
  if (error.code === 'ENOENT') {
    return 'File not found. Please check that the file exists and try again.'
  }

  if (error.code === 'EACCES' || error.code === 'EPERM') {
    return 'Permission denied. Please check file permissions and try again.'
  }

  if (error.code === 'ENOSPC') {
    return 'Not enough disk space. Please free up space and try again.'
  }

  if (error.message.includes('UNIQUE constraint failed')) {
    return 'This photo already exists in your library.'
  }

  if (error.message.includes('FOREIGN KEY constraint failed')) {
    return 'Cannot complete this operation due to data dependencies.'
  }

  // Generic fallback
  return 'An unexpected error occurred. Please try again.'
}

/**
 * Log error for debugging (technical details)
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 */
export function logError(error, context = {}) {
  console.error('[ERROR]', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    context
  })
}

/**
 * Handle error with user notification and logging
 * @param {Error} error - Error object
 * @param {Object} context - Additional context
 * @returns {string} User-friendly error message
 */
export function handleError(error, context = {}) {
  // Log technical details for debugging
  logError(error, context)

  // Return user-friendly message
  return formatErrorMessage(error)
}

/**
 * Wrap async function with error handling
 * @param {Function} fn - Async function to wrap
 * @param {Function} onError - Error handler callback
 * @returns {Function} Wrapped function
 */
export function withErrorHandling(fn, onError) {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (error) {
      const userMessage = handleError(error, { args })
      if (onError) {
        onError(userMessage, error)
      }
      throw error
    }
  }
}

/**
 * Show error message to user (UI notification)
 * @param {string|Error} error - Error message or Error object
 */
export function showError(error) {
  const message = typeof error === 'string' ? error : formatErrorMessage(error)
  
  // Log to console for debugging
  if (typeof error === 'object') {
    logError(error)
  }
  
  // Create toast notification
  const toast = document.createElement('div')
  toast.className = 'error-toast'
  toast.textContent = message
  toast.setAttribute('role', 'alert')
  toast.setAttribute('aria-live', 'assertive')
  
  document.body.appendChild(toast)
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10)
  
  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 5000)
}

/**
 * Show success message to user (UI notification)
 * @param {string} message - Success message
 */
export function showSuccess(message) {
  const toast = document.createElement('div')
  toast.className = 'success-toast'
  toast.textContent = message
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  
  document.body.appendChild(toast)
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10)
  
  // Auto-dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}
