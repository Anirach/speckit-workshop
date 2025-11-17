/**
 * Client-Side Navigation
 * History API-based routing
 */

const routes = new Map()
let currentRoute = null

/**
 * Register a route handler
 * @param {string} path - Route path (e.g., "/", "/album/:id")
 * @param {Function} handler - Handler function (receives params)
 */
export function registerRoute(path, handler) {
  routes.set(path, handler)
}

/**
 * Navigate to a route
 * @param {string} path - Route path
 * @param {Object} state - Optional state object
 */
export function navigateTo(path, state = {}) {
  // Update browser history
  window.history.pushState(state, '', path)

  // Execute route handler
  handleRoute(path)
}

/**
 * Handle route change
 * @param {string} path - Route path
 */
function handleRoute(path) {
  currentRoute = path

  // Match route pattern
  for (const [pattern, handler] of routes) {
    const params = matchRoute(pattern, path)
    if (params !== null) {
      handler(params)
      return
    }
  }

  // No matching route
  console.warn(`No route handler found for: ${path}`)
}

/**
 * Match route pattern against path
 * @param {string} pattern - Route pattern (e.g., "/album/:id")
 * @param {string} path - Actual path (e.g., "/album/123")
 * @returns {Object|null} Params object or null if no match
 */
function matchRoute(pattern, path) {
  const patternParts = pattern.split('/')
  const pathParts = path.split('/')

  if (patternParts.length !== pathParts.length) {
    return null
  }

  const params = {}

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]
    const pathPart = pathParts[i]

    if (patternPart.startsWith(':')) {
      // Dynamic parameter
      const paramName = patternPart.slice(1)
      params[paramName] = pathPart
    } else if (patternPart !== pathPart) {
      // Static part doesn't match
      return null
    }
  }

  return params
}

/**
 * Get current route
 * @returns {string} Current route path
 */
export function getCurrentRoute() {
  return currentRoute || window.location.pathname
}

/**
 * Go back in history
 */
export function goBack() {
  window.history.back()
}

/**
 * Initialize navigation (handle browser back/forward)
 */
export function initNavigation() {
  // Handle popstate (browser back/forward)
  window.addEventListener('popstate', () => {
    handleRoute(window.location.pathname)
  })

  // Handle initial route
  handleRoute(window.location.pathname)

  console.log('✓ Navigation initialized')
}
