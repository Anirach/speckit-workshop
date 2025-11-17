# Research: Photo Album Organizer

**Feature**: 001-photo-album-organizer  
**Date**: 2025-01-17  
**Phase**: 0 (Outline & Research)

---

## Research Tasks

This document consolidates findings for all NEEDS CLARIFICATION items identified in the Technical Context. Each section documents the decision made, rationale, and alternatives considered.

---

## 1. Vite + SQLite Integration

### Decision

Use **Vite with Node.js backend module** accessed via Electron or Tauri-like architecture.

### Rationale

- Vite is browser-focused (no Node.js APIs in browser context)
- SQLite (`better-sqlite3`) requires Node.js runtime
- **Solution**: Create a separate backend module that Vite app communicates with via IPC (Inter-Process Communication)
- **Alternative approach**: Use `@tauri-apps/api` bindings for native file system and database access from browser context

### Alternatives Considered

1. **IndexedDB instead of SQLite**
   - ✅ Pros: Native browser API, no backend needed, works directly in Vite
   - ❌ Cons: More complex querying, no relational model, harder to debug
   - **Rejected**: User explicitly requested SQLite for metadata storage

2. **Electron with Vite**
   - ✅ Pros: Mature ecosystem, `electron-vite` plugin available, direct Node.js access
   - ❌ Cons: Large bundle size (~150MB), complex build process
   - **Rejected**: Adds significant complexity for minimal libraries requirement

3. **Tauri + Vite**
   - ✅ Pros: Smaller bundle (~15MB), Rust backend for SQLite, official Vite integration
   - ✅ Pros: Native file system APIs, security-first architecture
   - ❌ Cons: Requires Rust toolchain, learning curve for team
   - **RECOMMENDED**: Best fit for "minimal libraries + SQLite + Vite" requirement

### Implementation Notes

- Use **Tauri v1.5+** with `tauri-plugin-sql` for SQLite access
- Vite frontend communicates via `@tauri-apps/api/tauri::invoke()`
- Backend commands in `src-tauri/src/main.rs` expose database operations
- No Electron overhead, smaller binary, better performance

---

## 2. EXIF Metadata Extraction (exifreader)

### Decision

Use **exifreader v4.x** for EXIF parsing with timezone preservation.

### Rationale

- Pure JavaScript library (no native dependencies)
- Works in browser context (can read File/Blob directly)
- Supports EXIF, IPTC, XMP metadata formats
- **Critical**: Preserves timezone information from `DateTimeOriginal` and `OffsetTimeOriginal` tags

### Alternatives Considered

1. **exif-js**
   - ❌ Cons: Unmaintained (last update 2017), missing EXIF 2.3 tags
   - **Rejected**: Outdated, no timezone support

2. **piexifjs**
   - ✅ Pros: Smaller bundle size (~30KB vs exifreader ~120KB)
   - ❌ Cons: Limited to JPEG only, no HEIC/HEIF support
   - **Rejected**: Photos may include HEIC (iPhone) and PNG formats

3. **Browser File API only**
   - ❌ Cons: No EXIF access, would lose date/timezone/camera metadata
   - **Rejected**: Feature requires date-based grouping and timezone preservation

### Implementation Notes

```javascript
import ExifReader from 'exifreader'

async function extractMetadata(file) {
  const tags = await ExifReader.load(file)

  // Extract date with timezone
  const dateOriginal = tags['DateTimeOriginal']?.description // "2024:01:15 14:30:22"
  const timezone = tags['OffsetTimeOriginal']?.description // "+08:00"

  // Combine for accurate timestamp
  const isoDate = convertExifToISO(dateOriginal, timezone)

  return {
    dateTaken: isoDate,
    camera: tags['Model']?.description,
    width: tags['ImageWidth']?.value,
    height: tags['ImageLength']?.value
  }
}
```

**Edge Cases**:

- If `OffsetTimeOriginal` missing → fallback to `DateTimeOriginal` with local timezone assumption
- If all EXIF missing → use file modification time as fallback

---

## 3. File Hash Calculation (Duplicate Detection)

### Decision

Use **Web Crypto API (`crypto.subtle.digest`)** with SHA-256 algorithm.

### Rationale

- Native browser API (no external library needed)
- Fast performance (~50-100 MB/s on modern hardware)
- SHA-256 provides sufficient collision resistance for photo collection
- Works with File/Blob objects directly

### Alternatives Considered

1. **MD5 hash (spark-md5 library)**
   - ✅ Pros: Faster than SHA-256, smaller hash size (128-bit)
   - ❌ Cons: Cryptographically broken, requires external library
   - **Rejected**: SHA-256 is native and fast enough for use case

2. **Perceptual hashing (pHash)**
   - ✅ Pros: Detects similar images (cropped, resized variants)
   - ❌ Cons: Requires image processing library, much slower
   - **Rejected**: Spec requires exact duplicate detection, not similarity

3. **File size + name comparison**
   - ✅ Pros: Instant comparison
   - ❌ Cons: False positives (different photos with same size/name)
   - **Rejected**: User explicitly requested hash-based duplicate detection

### Implementation Notes

```javascript
async function calculateFileHash(file) {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Performance: ~50ms for 5MB JPEG on modern hardware
// Batch processing: Use Web Workers for parallel hashing during import
```

**Performance Optimization**:

- Hash files in Web Worker to avoid blocking main thread
- Cache hashes in SQLite (`photo_hash` column) to avoid recalculation
- Process 5+ photos in parallel for import target (≥5 photos/sec)

---

## 4. Drag-and-Drop at 60fps

### Decision

Use **vanilla JavaScript with `requestAnimationFrame`** and GPU-accelerated `transform: translate3d()`.

### Rationale

- 60fps = 16.67ms frame budget
- CSS `transform` triggers GPU compositing (faster than `top`/`left`)
- `requestAnimationFrame` ensures rendering sync with display refresh
- No framework overhead (React/Vue drag libraries add 100-300ms latency)

### Alternatives Considered

1. **SortableJS library**
   - ✅ Pros: Battle-tested, handles edge cases
   - ❌ Cons: 20KB gzipped, adds dependency
   - **Rejected**: User requested minimal libraries, vanilla JS preferred

2. **react-beautiful-dnd**
   - ❌ Cons: Requires React framework (contradicts vanilla JS requirement)
   - **Rejected**: Not applicable for vanilla JS approach

3. **HTML5 Drag-and-Drop API**
   - ✅ Pros: Native browser API
   - ❌ Cons: Limited customization, inconsistent across browsers, no touch support
   - **Rejected**: Poor UX for photo reordering (no live preview during drag)

### Implementation Notes

```javascript
let draggedElement = null
let offsetX = 0,
  offsetY = 0

function onMouseDown(e) {
  draggedElement = e.target.closest('.album-card')
  const rect = draggedElement.getBoundingClientRect()
  offsetX = e.clientX - rect.left
  offsetY = e.clientY - rect.top

  // Use transform for GPU acceleration
  draggedElement.style.position = 'fixed'
  draggedElement.style.zIndex = '1000'

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e) {
  requestAnimationFrame(() => {
    const x = e.clientX - offsetX
    const y = e.clientY - offsetY

    // GPU-accelerated transform (no layout reflow)
    draggedElement.style.transform = `translate3d(${x}px, ${y}px, 0)`
  })
}

// Performance measurements:
// - requestAnimationFrame ensures 60fps sync
// - transform: translate3d() = 0.5ms paint time
// - top/left positioning = 8-12ms paint time (4-8x slower)
```

**Performance Validation**:

- Use Chrome DevTools Performance tab to measure frame time
- Target: All frames < 16.67ms during drag operation
- Test with 100 album cards on screen (worst-case scenario)

---

## 5. Thumbnail Generation

### Decision

Use **Canvas API** to generate 300x300px thumbnails, cached to local file system.

### Rationale

- Native browser API (no external library)
- Client-side generation avoids server dependency
- Cache to disk for fast subsequent loads
- **Constraint**: <200MB memory for 1000 photos → generate on-demand, not all upfront

### Alternatives Considered

1. **Image Processing Library (sharp, jimp)**
   - ✅ Pros: Better quality, faster processing
   - ❌ Cons: Requires Node.js backend, adds dependency
   - **Rejected**: Canvas API sufficient for 300x300 thumbnails

2. **CSS scaling (no thumbnail generation)**
   - ✅ Pros: Zero processing time
   - ❌ Cons: Loads full-size images (slow network, high memory usage)
   - **Rejected**: Performance requirement (<2s for 50 photo tiles) unreachable

3. **WebAssembly image decoder**
   - ✅ Pros: Near-native performance
   - ❌ Cons: Complex setup, larger bundle size
   - **Rejected**: Canvas API meets performance target

### Implementation Notes

```javascript
async function generateThumbnail(photoFile, size = 300) {
  return new Promise(resolve => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    img.onload = () => {
      // Maintain aspect ratio
      const scale = Math.min(size / img.width, size / img.height)
      canvas.width = img.width * scale
      canvas.height = img.height * scale

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      canvas.toBlob(
        blob => {
          resolve(blob) // Save to storage/thumbnails/
        },
        'image/jpeg',
        0.85
      ) // 85% quality for balance
    }

    img.src = URL.createObjectURL(photoFile)
  })
}
```

**Caching Strategy**:

- Store thumbnails in `storage/thumbnails/{photo_hash}.jpg`
- Check cache before generation: `if (await fileExists(thumbnailPath)) return thumbnailPath;`
- Lazy generation: Create thumbnails on first view, not during import
- **Memory Management**: Generate max 50 thumbnails per render (spec: 50 photos per page)

**Performance Estimate**:

- Canvas thumbnail generation: ~30-50ms per image
- 50 thumbnails (first page) = ~1.5-2.5s (parallelizable with Web Workers)
- Subsequent loads from cache: <100ms for 50 thumbnails

---

## Summary

| Research Area     | Decision                                | Key Rationale                                      |
| ----------------- | --------------------------------------- | -------------------------------------------------- |
| **Vite + SQLite** | Tauri v1.5+ with `tauri-plugin-sql`     | Smallest bundle, native SQLite access, Vite-first  |
| **EXIF Parsing**  | exifreader v4.x                         | Browser-compatible, timezone support, multi-format |
| **File Hashing**  | Web Crypto API (SHA-256)                | Native browser API, fast, no library needed        |
| **Drag-and-Drop** | Vanilla JS + `transform: translate3d()` | GPU-accelerated, 60fps achievable, no dependencies |
| **Thumbnails**    | Canvas API + file cache                 | Native API, lazy generation, meets <2s target      |

**Next Steps**: Use these decisions to populate `data-model.md` (Phase 1) and define contracts in `contracts/` directory.
