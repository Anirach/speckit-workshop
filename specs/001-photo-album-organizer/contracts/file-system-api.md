# File System API Contract

**Feature**: 001-photo-album-organizer  
**Date**: 2025-01-17  
**Version**: 1.0

---

## Overview

This contract defines the file system operations required for the Photo Album Organizer. All file operations are asynchronous and return Promises.

**Technology**: Tauri File System API (`@tauri-apps/api/fs`) or Node.js `fs.promises`

---

## API: Photo Storage

### `copyPhotoToStorage(sourcePath: string): Promise<PhotoFileInfo>`

Copies photo file from user selection to application storage directory.

**Parameters**:

- `sourcePath`: Absolute path to user-selected photo file

**Returns**:

```typescript
interface PhotoFileInfo {
  filePath: string // Destination path in storage/photos/
  fileName: string // Original filename
  fileSize: number // File size in bytes
  mimeType: string // Detected MIME type
}
```

**Behavior**:

1. Validate file exists and is readable
2. Detect MIME type from file extension/magic bytes
3. Copy to `storage/photos/{yyyy-mm}/{filename}`
4. Preserve original filename
5. Return file metadata

**Errors**:

- `FileNotFoundError`: Source file doesn't exist
- `UnsupportedFormatError`: File is not JPEG/PNG/HEIC/HEIF
- `DiskSpaceError`: Insufficient disk space
- `PermissionError`: Cannot read source or write destination

**Example**:

```javascript
const fileInfo = await copyPhotoToStorage('/Users/anirach/Downloads/IMG_1234.jpg')
// Returns: {
//   filePath: 'storage/photos/2024-01/IMG_1234.jpg',
//   fileName: 'IMG_1234.jpg',
//   fileSize: 5242880,
//   mimeType: 'image/jpeg'
// }
```

---

### `deletePhoto(filePath: string): Promise<void>`

Permanently deletes photo file from storage.

**Parameters**:

- `filePath`: Absolute path to photo in `storage/photos/`

**Returns**: `Promise<void>` (resolves on success)

**Behavior**:

1. Verify file exists in storage directory
2. Delete file from disk
3. No recycle bin / trash (permanent deletion per spec)

**Errors**:

- `FileNotFoundError`: File doesn't exist
- `PermissionError`: Cannot delete file

**Example**:

```javascript
await deletePhoto('storage/photos/2024-01/IMG_1234.jpg')
```

---

### `deleteThumbnail(thumbnailPath: string): Promise<void>`

Deletes generated thumbnail file.

**Parameters**:

- `thumbnailPath`: Absolute path to thumbnail in `storage/thumbnails/`

**Returns**: `Promise<void>`

**Behavior**:

1. Delete thumbnail file if exists
2. Silently succeed if file doesn't exist (idempotent)

**Errors**:

- `PermissionError`: Cannot delete file

**Example**:

```javascript
await deleteThumbnail('storage/thumbnails/abc123def456.jpg')
```

---

## API: Thumbnail Storage

### `saveThumbnail(blob: Blob, hash: string): Promise<string>`

Saves generated thumbnail to disk.

**Parameters**:

- `blob`: Thumbnail image data (JPEG format, 300x300px)
- `hash`: Photo file hash (used as filename)

**Returns**: `string` - Path to saved thumbnail

**Behavior**:

1. Create `storage/thumbnails/` directory if doesn't exist
2. Save blob to `storage/thumbnails/{hash}.jpg`
3. Return absolute path

**Errors**:

- `DiskSpaceError`: Insufficient disk space
- `PermissionError`: Cannot write to thumbnails directory

**Example**:

```javascript
const canvas = generateThumbnail(photoFile)
canvas.toBlob(async blob => {
  const path = await saveThumbnail(blob, 'abc123def456')
  // Returns: 'storage/thumbnails/abc123def456.jpg'
})
```

---

### `loadThumbnail(hash: string): Promise<Blob | null>`

Loads thumbnail from disk if exists.

**Parameters**:

- `hash`: Photo file hash

**Returns**: `Blob | null` - Thumbnail image data, or null if not cached

**Behavior**:

1. Check if `storage/thumbnails/{hash}.jpg` exists
2. If exists, read file and return as Blob
3. If not exists, return null

**Errors**:

- `PermissionError`: Cannot read file

**Example**:

```javascript
const thumbnail = await loadThumbnail('abc123def456')
if (thumbnail) {
  const url = URL.createObjectURL(thumbnail)
  imgElement.src = url
} else {
  // Generate thumbnail
}
```

---

## API: File Hash Calculation

### `calculateFileHash(filePath: string): Promise<string>`

Calculates SHA-256 hash of file for duplicate detection.

**Parameters**:

- `filePath`: Absolute path to file

**Returns**: `string` - 64-character hex SHA-256 hash

**Behavior**:

1. Read file in chunks (to handle large files efficiently)
2. Calculate SHA-256 hash using Web Crypto API or Node.js `crypto`
3. Return lowercase hex string

**Errors**:

- `FileNotFoundError`: File doesn't exist
- `PermissionError`: Cannot read file

**Example**:

```javascript
const hash = await calculateFileHash('storage/photos/2024-01/IMG_1234.jpg')
// Returns: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
```

---

## API: File Existence Check

### `fileExists(filePath: string): Promise<boolean>`

Checks if file exists at given path.

**Parameters**:

- `filePath`: Absolute path to file

**Returns**: `boolean` - true if exists, false otherwise

**Behavior**:

1. Check file existence without reading contents
2. Return true/false (never throws)

**Example**:

```javascript
if (await fileExists('storage/thumbnails/abc123.jpg')) {
  // Use cached thumbnail
} else {
  // Generate new thumbnail
}
```

---

## API: Directory Management

### `ensureDirectory(dirPath: string): Promise<void>`

Creates directory if it doesn't exist (recursive).

**Parameters**:

- `dirPath`: Absolute path to directory

**Returns**: `Promise<void>`

**Behavior**:

1. Create directory and all parent directories (like `mkdir -p`)
2. Silently succeed if directory already exists

**Errors**:

- `PermissionError`: Cannot create directory

**Example**:

```javascript
await ensureDirectory('storage/photos/2024-01')
await ensureDirectory('storage/thumbnails')
```

---

### `listFiles(dirPath: string, pattern?: string): Promise<string[]>`

Lists files in directory matching optional pattern.

**Parameters**:

- `dirPath`: Absolute path to directory
- `pattern`: Optional glob pattern (e.g., "\*.jpg")

**Returns**: `string[]` - Array of absolute file paths

**Behavior**:

1. Read directory contents
2. Filter by pattern if provided
3. Return full paths (not just filenames)

**Errors**:

- `DirectoryNotFoundError`: Directory doesn't exist
- `PermissionError`: Cannot read directory

**Example**:

```javascript
const photos = await listFiles('storage/photos/2024-01', '*.jpg')
// Returns: [
//   'storage/photos/2024-01/IMG_1234.jpg',
//   'storage/photos/2024-01/IMG_1235.jpg'
// ]
```

---

## Storage Structure

```text
storage/
├── photos/
│   ├── 2024-01/
│   │   ├── IMG_1234.jpg
│   │   └── IMG_1235.jpg
│   ├── 2024-02/
│   │   └── IMG_1300.jpg
│   └── ...
├── thumbnails/
│   ├── abc123def456.jpg    # Hash-based filename
│   ├── def789ghi012.jpg
│   └── ...
└── metadata.db             # SQLite database
```

**Design Decisions**:

1. **Photos organized by year-month**: Improves file system performance (fewer files per directory)
2. **Thumbnails use hash as filename**: Avoids duplicates, enables fast lookup
3. **No nested album directories**: Albums are logical groupings in database, not file system

---

## Performance Requirements

From spec (Performance Requirements section):

| Operation          | Target              | Implementation                                   |
| ------------------ | ------------------- | ------------------------------------------------ |
| **Copy photo**     | <500ms per file     | Stream copy, avoid loading entire file in memory |
| **Calculate hash** | <100ms for 5MB file | SHA-256 via Web Crypto (hardware-accelerated)    |
| **Save thumbnail** | <50ms               | Direct blob write (small file ~30KB)             |
| **Load thumbnail** | <20ms               | Read from disk cache                             |

**Batch Operations**:

- Import 100 photos: <20s total (5+ photos/sec)
- Delete 50 photos: <2s total (parallel unlink)

---

## Error Handling

All API methods follow consistent error handling:

```javascript
try {
  const result = await copyPhotoToStorage(sourcePath)
} catch (error) {
  if (error instanceof FileNotFoundError) {
    // Show user-friendly message: "File not found"
  } else if (error instanceof DiskSpaceError) {
    // Show user-friendly message: "Not enough disk space"
  } else if (error instanceof UnsupportedFormatError) {
    // Show user-friendly message: "Unsupported file format"
  } else {
    // Generic error handling
  }
}
```

**Constitution Compliance** (Principle III):

- Error messages are user-friendly and actionable
- Technical details logged separately for debugging
- All errors use consistent message format

---

## Testing Strategy

**Contract Tests** (using Web Test Runner):

```javascript
// tests/contract/file-system.test.js
describe('File System API', () => {
  it('should copy photo to storage', async () => {
    const fileInfo = await copyPhotoToStorage('/path/to/test.jpg')
    expect(fileInfo.filePath).toMatch(/storage\/photos\/\d{4}-\d{2}\/test\.jpg/)
    expect(fileInfo.fileSize).toBeGreaterThan(0)
  })

  it('should calculate consistent file hash', async () => {
    const hash1 = await calculateFileHash('/path/to/test.jpg')
    const hash2 = await calculateFileHash('/path/to/test.jpg')
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it('should detect duplicate by hash', async () => {
    const hash1 = await calculateFileHash('/path/to/photo1.jpg')
    const hash2 = await calculateFileHash('/path/to/photo1-copy.jpg') // Same content
    expect(hash1).toBe(hash2)
  })
})
```

**Mocking for Unit Tests**:

```javascript
// Mock file system for service layer tests
vi.mock('@/lib/file-system', () => ({
  copyPhotoToStorage: vi.fn().mockResolvedValue({
    filePath: 'storage/photos/2024-01/test.jpg',
    fileName: 'test.jpg',
    fileSize: 1024,
    mimeType: 'image/jpeg'
  }),
  calculateFileHash: vi.fn().mockResolvedValue('abc123def456')
}))
```

---

## Summary

This file system API provides:

- **Photo storage**: Copy, delete, organize by date
- **Thumbnail caching**: Save, load, delete
- **Duplicate detection**: SHA-256 hashing
- **Directory management**: Create, list, ensure
- **Error handling**: Consistent, user-friendly errors
- **Performance**: Meets <2s photo tiles, ≥5 photos/sec import targets

**Next Steps**: Implement in `src/lib/file-system.js` and create contract tests in `tests/contract/file-system.test.js`.
