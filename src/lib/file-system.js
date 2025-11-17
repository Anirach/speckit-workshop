/**
 * File System Operations
 * Browser-compatible File API for photo management
 * 
 * NOTE: This uses File API and IndexedDB for browser compatibility.
 * For production desktop app, use Tauri file system APIs.
 */

/**
 * Copy photo file to storage (browser-compatible using IndexedDB)
 * @param {File} sourceFile - User-selected photo File object
 * @param {string} storageDir - Base storage directory (not used in browser)
 * @param {string} yearMonth - Year-month folder (e.g., "2024-01")
 * @returns {Promise<Object>} File info object
 */
export async function copyPhotoToStorage(sourceFile, storageDir, yearMonth) {
  if (!sourceFile || !(sourceFile instanceof File)) {
    throw new Error('Invalid file object')
  }

  // In browser, we store file data in IndexedDB
  const fileName = sourceFile.name
  const mimeType = sourceFile.type || detectMimeType(fileName)
  const fileSize = sourceFile.size

  // Generate unique file path (virtual path for browser)
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 9)
  const filePath = `storage/photos/${yearMonth}/${timestamp}_${randomId}_${fileName}`

  // Read file as ArrayBuffer to store in IndexedDB
  const arrayBuffer = await sourceFile.arrayBuffer()

  // Store file data in IndexedDB
  await storeFileData(filePath, arrayBuffer, mimeType)

  return {
    filePath,
    fileName,
    fileSize,
    mimeType
  }
}

/**
 * Store file data in IndexedDB
 * @param {string} filePath - Virtual file path
 * @param {ArrayBuffer} data - File data
 * @param {string} mimeType - MIME type
 */
async function storeFileData(filePath, data, mimeType) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PhotoFiles', 1)

    request.onerror = () => reject(request.error)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files', { keyPath: 'path' })
      }
    }

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('files', 'readwrite')
      const store = tx.objectStore('files')
      
      const fileRecord = {
        path: filePath,
        data,
        mimeType,
        createdAt: new Date().toISOString()
      }

      const putRequest = store.put(fileRecord)
      
      putRequest.onsuccess = () => resolve()
      putRequest.onerror = () => reject(putRequest.error)
    }
  })
}

/**
 * Get file data from IndexedDB
 * @param {string} filePath - Virtual file path
 * @returns {Promise<Object>} File data object
 */
export async function getFileData(filePath) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PhotoFiles', 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const getRequest = store.get(filePath)

      getRequest.onsuccess = () => {
        resolve(getRequest.result || null)
      }
      getRequest.onerror = () => reject(getRequest.error)
    }
  })
}

/**
 * Delete photo file from storage
 * @param {string} filePath - Virtual file path
 */
export async function deletePhoto(filePath) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PhotoFiles', 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('files', 'readwrite')
      const store = tx.objectStore('files')
      const deleteRequest = store.delete(filePath)

      deleteRequest.onsuccess = () => resolve()
      deleteRequest.onerror = () => reject(deleteRequest.error)
    }
  })
}

/**
 * Delete thumbnail file
 * @param {string} thumbnailPath - Virtual thumbnail path
 */
export async function deleteThumbnail(thumbnailPath) {
  try {
    await deletePhoto(thumbnailPath)
  } catch (error) {
    console.warn(`Failed to delete thumbnail: ${thumbnailPath}`, error)
  }
}

/**
 * Check if file exists
 * @param {string} filePath - Virtual file path
 * @returns {Promise<boolean>} True if exists
 */
export async function fileExists(filePath) {
  try {
    const fileData = await getFileData(filePath)
    return fileData !== null
  } catch (error) {
    return false
  }
}

/**
 * Ensure directory exists (no-op in browser)
 * @param {string} dirPath - Directory path (ignored in browser)
 */
export function ensureDirectory(dirPath) {
  // No-op in browser - directories are virtual
  return Promise.resolve()
}

/**
 * List files in directory (browser-compatible)
 * @param {string} dirPath - Virtual directory path
 * @param {string} pattern - Optional pattern (e.g., "*.jpg")
 * @returns {Promise<string[]>} Array of file paths
 */
export async function listFiles(dirPath, pattern = null) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PhotoFiles', 1)

    request.onerror = () => reject(request.error)

    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const getAllRequest = store.getAllKeys()

      getAllRequest.onsuccess = () => {
        let files = getAllRequest.result
        
        // Filter by directory
        files = files.filter(path => path.startsWith(dirPath))

        // Filter by pattern if provided
        if (pattern) {
          const regex = new RegExp(pattern.replace(/\./g, '\\.').replace(/\*/g, '.*'))
          files = files.filter(path => regex.test(path))
        }

        resolve(files)
      }
      getAllRequest.onerror = () => reject(getAllRequest.error)
    }
  })
}

/**
 * Detect MIME type from file extension
 * @param {string} fileName - Filename
 * @returns {string} MIME type
 */
function detectMimeType(fileName) {
  const ext = fileName.toLowerCase().match(/\.[^.]+$/)?.[0]

  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.heic': 'image/heic',
    '.heif': 'image/heif',
    '.webp': 'image/webp'
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Validate photo file format
 * @param {string} fileName - Filename
 * @returns {boolean} True if supported format
 */
export function isSupportedFormat(fileName) {
  const mimeType = detectMimeType(fileName)
  const supported = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp']
  return supported.includes(mimeType)
}
