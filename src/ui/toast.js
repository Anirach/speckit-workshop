/**
 * Toast Notification System
 * User-friendly error and success messages following Principle III: UX Consistency
 */

let toastContainer = null

/**
 * Initialize toast container if not exists
 */
function ensureToastContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div')
    toastContainer.className = 'toast-container'
    toastContainer.setAttribute('aria-live', 'polite')
    toastContainer.setAttribute('aria-atomic', 'true')
    document.body.appendChild(toastContainer)
  }
  return toastContainer
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success', 'error', 'info' (default: 'info')
 * @param {number} duration - Auto-dismiss duration in ms (default: 4000, 0 = no auto-dismiss)
 * @returns {HTMLElement} Toast element
 */
export function showToast(message, type = 'info', duration = 4000) {
  const container = ensureToastContainer()

  const toast = document.createElement('div')
  toast.className = `toast toast-${type}`
  toast.setAttribute('role', 'alert')

  const icon = getToastIcon(type)

  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${icon}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close" aria-label="Close notification">✕</button>
  `

  const closeBtn = toast.querySelector('.toast-close')
  closeBtn.onclick = () => dismissToast(toast)

  container.appendChild(toast)

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => {
      dismissToast(toast)
    }, duration)
  }

  return toast
}

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Auto-dismiss duration in ms
 */
export function showSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration)
}

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Auto-dismiss duration (default: 5000, longer for errors)
 */
export function showError(message, duration = 5000) {
  return showToast(message, 'error', duration)
}

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Auto-dismiss duration in ms
 */
export function showInfo(message, duration = 4000) {
  return showToast(message, 'info', duration)
}

/**
 * Dismiss a toast notification
 * @param {HTMLElement} toast - Toast element to dismiss
 */
export function dismissToast(toast) {
  if (!toast || !toast.parentElement) return

  toast.style.animation = 'slideOutRight 0.3s ease-out'
  setTimeout(() => {
    if (toast.parentElement) {
      toast.remove()
    }
  }, 300)
}

/**
 * Clear all toast notifications
 */
export function clearAllToasts() {
  if (!toastContainer) return

  const toasts = toastContainer.querySelectorAll('.toast')
  toasts.forEach(toast => dismissToast(toast))
}

/**
 * Get icon for toast type
 * @param {string} type - Toast type
 * @returns {string} Icon character
 */
function getToastIcon(type) {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'info':
      return 'ℹ'
    default:
      return 'ℹ'
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Format error for user display (Principle III: UX Consistency)
 * Format: "Action failed: [reason]. [Suggested fix]"
 * @param {Error|string} error - Error object or message
 * @param {string} action - Action that failed (e.g., "Import photo", "Delete album")
 * @param {string} suggestion - Optional suggested fix
 * @returns {string} Formatted error message
 */
export function formatError(error, action, suggestion = '') {
  const reason = error instanceof Error ? error.message : String(error)
  let message = `${action} failed: ${reason}.`

  if (suggestion) {
    message += ` ${suggestion}`
  }

  return message
}

/**
 * Show formatted error toast
 * @param {Error|string} error - Error object or message
 * @param {string} action - Action that failed
 * @param {string} suggestion - Optional suggested fix
 */
export function showFormattedError(error, action, suggestion = '') {
  const message = formatError(error, action, suggestion)
  return showError(message)
}

// Export for main.js registration
export default {
  showToast,
  showSuccess,
  showError,
  showInfo,
  dismissToast,
  clearAllToasts,
  formatError,
  showFormattedError
}
