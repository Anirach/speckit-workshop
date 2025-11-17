/**
 * Database Connection Manager
 * API client for SQLite backend
 */

const API_BASE = 'http://localhost:3451/api'

let connectionCount = 0
let lastActivity = Date.now()

/**
 * Make API request to backend
 */
async function apiRequest(endpoint, options = {}) {
  lastActivity = Date.now()
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'API request failed' }))
    throw new Error(error.error || 'API request failed')
  }

  return response.json()
}

/**
 * Get database connection (compatibility function)
 * @returns {Promise<Object>} Mock database object
 */
export async function getDatabase() {
  connectionCount++
  console.log(`✓ Database API connected (connection #${connectionCount})`)
  return { connected: true }
}

/**
 * Close database connection (no-op for API)
 */
export function closeDatabase() {
  console.log('✓ Database API connection closed')
}

/**
 * Run a transaction (executes function directly for API)
 * @param {Function} fn - Async function to execute
 * @returns {Promise<*>} Result of the transaction function
 */
export async function transaction(fn) {
  return fn()
}

/**
 * Execute a query that returns multiple rows
 * @param {string} storeName - Table name
 * @param {Object} options - Query options (for compatibility)
 * @returns {Promise<Array>} Query results
 */
export async function query(storeName, options = {}) {
  lastActivity = Date.now()

  // Map store names to API endpoints
  const endpoints = {
    'Album': '/albums',
    'Photo': '/photos',
    'AlbumOrder': '/album-orders',
    'ImportSession': '/import-sessions'
  }

  const endpoint = endpoints[storeName]
  if (!endpoint) {
    throw new Error(`Unknown store: ${storeName}`)
  }

  const results = await apiRequest(endpoint)

  // Apply filters if provided (for compatibility with old code)
  let filtered = results
  if (options.where) {
    filtered = results.filter(options.where)
  }

  if (options.orderBy) {
    filtered.sort(options.orderBy)
  }

  if (options.limit) {
    filtered = filtered.slice(0, options.limit)
  }

  return filtered
}

/**
 * Execute a single-row query
 * @param {string} storeName - Table name
 * @param {number|Object} key - Primary key or query options
 * @returns {Promise<Object|null>} Single row or null
 */
export async function queryOne(storeName, key) {
  lastActivity = Date.now()

  const endpoints = {
    'Album': '/albums',
    'Photo': '/photos',
    'AlbumOrder': '/album-orders',
    'ImportSession': '/import-sessions'
  }

  const endpoint = endpoints[storeName]
  if (!endpoint) {
    throw new Error(`Unknown store: ${storeName}`)
  }

  if (typeof key === 'number') {
    try {
      return await apiRequest(`${endpoint}/${key}`)
    } catch (error) {
      return null
    }
  }

  // Query with filter
  const results = await apiRequest(endpoint)
  if (key.where) {
    return results.filter(key.where)[0] || null
  }

  return results[0] || null
}

/**
 * Execute an insert/update/delete operation
 * @param {string} storeName - Table name
 * @param {string} operation - 'add', 'put', or 'delete'
 * @param {Object|number} data - Data to insert/update or key to delete
 * @returns {Promise<Object>} Operation info
 */
export async function execute(storeName, operation, data) {
  lastActivity = Date.now()

  const endpoints = {
    'Album': '/albums',
    'Photo': '/photos',
    'AlbumOrder': '/album-orders',
    'ImportSession': '/import-sessions'
  }

  const endpoint = endpoints[storeName]
  if (!endpoint) {
    throw new Error(`Unknown store: ${storeName}`)
  }

  if (operation === 'delete') {
    await apiRequest(`${endpoint}/${data}`, { method: 'DELETE' })
    return { changes: 1 }
  } else if (operation === 'add') {
    const result = await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    return { changes: 1, lastInsertRowid: result.id }
  } else if (operation === 'put') {
    const id = data.id || data.album_id
    const result = await apiRequest(`${endpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
    return { changes: 1, lastInsertRowid: result.id }
  }
}

/**
 * Get connection statistics
 * @returns {Object} Connection stats
 */
export function getConnectionStats() {
  return {
    isConnected: true,
    connectionCount,
    lastActivity: new Date(lastActivity).toISOString(),
    inactiveTime: Date.now() - lastActivity,
    dbName: 'SQLite via API (http://localhost:3451)'
  }
}
