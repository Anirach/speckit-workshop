# UI Components Contract

**Feature**: 001-photo-album-organizer  
**Date**: 2025-01-17  
**Version**: 1.0

---

## Overview

This contract defines the UI components for the Photo Album Organizer. All components are implemented in vanilla JavaScript with direct DOM manipulation (no framework).

**Technology**: Vanilla JavaScript ES2022+, CSS3, HTML5

---

## Component: AlbumList

### Purpose
Displays grid of album cards on main page with drag-and-drop reordering.

### HTML Structure
```html
<div id="album-list" class="album-grid" role="list" aria-label="Photo albums">
  <!-- Album cards inserted dynamically -->
</div>
```

### JavaScript API

#### `renderAlbumList(albums: Album[]): void`

Renders album grid from array of Album entities.

**Parameters**:
```typescript
interface Album {
  id: number;
  title: string;
  year: number;
  month: number;
  photo_count: number;
  cover_photo_id?: number;
  cover_thumbnail_path?: string;
}
```

**Behavior**:
1. Clear existing album cards
2. Create album card for each album
3. Attach click event → navigate to album detail
4. Attach drag-and-drop handlers
5. Apply ARIA labels for accessibility

**Example**:
```javascript
import { renderAlbumList } from '@/ui/album-list.js';

const albums = await albumService.getAllAlbums();
renderAlbumList(albums);
```

---

#### `createAlbumCard(album: Album): HTMLElement`

Creates single album card element.

**Returns**: DOM element with structure:
```html
<div class="album-card" data-album-id="1" draggable="true" role="listitem">
  <div class="album-cover">
    <img src="storage/thumbnails/abc123.jpg" alt="January 2024 album cover" loading="lazy">
  </div>
  <div class="album-info">
    <h3 class="album-title">January 2024</h3>
    <p class="album-count">15 photos</p>
  </div>
</div>
```

**Accessibility**:
- `role="listitem"` for screen reader navigation
- `alt` text includes album title
- `tabindex="0"` for keyboard navigation
- `aria-label` for drag handle

---

#### `attachDragHandlers(cardElement: HTMLElement): void`

Attaches drag-and-drop event handlers to album card.

**Events**:
- `mousedown` → start drag
- `mousemove` → update position (60fps via `requestAnimationFrame`)
- `mouseup` → end drag, save new position

**Performance**:
- Use `transform: translate3d()` for GPU acceleration
- Target: 60fps (16.67ms per frame)
- Debounce position updates to avoid excessive renders

**Example**:
```javascript
const card = createAlbumCard(album);
attachDragHandlers(card);
albumListElement.appendChild(card);
```

---

### CSS Classes

```css
.album-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.album-card {
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}

.album-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.album-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
  z-index: 1000;
}

.album-cover {
  aspect-ratio: 1;
  background: #f0f0f0;
  overflow: hidden;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-info {
  padding: 12px;
  background: white;
}

.album-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.album-count {
  font-size: 14px;
  color: #666;
  margin: 0;
}
```

---

## Component: PhotoGrid

### Purpose
Displays grid of photo thumbnails within an album.

### HTML Structure
```html
<div id="photo-grid" class="photo-grid" role="list" aria-label="Album photos">
  <!-- Photo tiles inserted dynamically -->
</div>
```

### JavaScript API

#### `renderPhotoGrid(photos: Photo[]): void`

Renders photo grid from array of Photo entities.

**Parameters**:
```typescript
interface Photo {
  id: number;
  file_name: string;
  thumbnail_path?: string;
  date_taken: string;
  width: number;
  height: number;
}
```

**Behavior**:
1. Clear existing photo tiles
2. Create photo tile for each photo
3. Load thumbnail (lazy loading with IntersectionObserver)
4. Attach click event → open photo viewer
5. Display 50 photos per page (pagination)

**Performance**:
- Use `loading="lazy"` for images
- Virtual scrolling for 100+ photos
- Target: <2s to render 50 thumbnails

**Example**:
```javascript
import { renderPhotoGrid } from '@/ui/photo-grid.js';

const photos = await photoService.getPhotosInAlbum(albumId);
renderPhotoGrid(photos);
```

---

#### `createPhotoTile(photo: Photo): HTMLElement`

Creates single photo tile element.

**Returns**: DOM element with structure:
```html
<div class="photo-tile" data-photo-id="1" role="listitem">
  <img 
    src="storage/thumbnails/abc123.jpg" 
    alt="Photo taken on 2024-01-15"
    loading="lazy"
    width="300"
    height="300"
  >
  <div class="photo-overlay">
    <span class="photo-date">Jan 15, 2024</span>
  </div>
</div>
```

**Accessibility**:
- `alt` text includes capture date
- `role="listitem"` for screen reader navigation
- `width`/`height` attributes prevent layout shift

---

### CSS Classes

```css
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  padding: 20px;
}

.photo-tile {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
}

.photo-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.photo-tile:hover img {
  transform: scale(1.05);
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  padding: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.photo-tile:hover .photo-overlay {
  opacity: 1;
}

.photo-date {
  color: white;
  font-size: 12px;
}
```

---

## Component: ProgressIndicator

### Purpose
Shows import progress with percentage and file counts.

### HTML Structure
```html
<div id="import-progress" class="progress-modal" role="dialog" aria-labelledby="progress-title">
  <div class="progress-content">
    <h2 id="progress-title">Importing Photos</h2>
    <div class="progress-bar">
      <div class="progress-fill" style="width: 45%"></div>
    </div>
    <p class="progress-text">
      <span class="progress-current">23</span> / <span class="progress-total">50</span> photos
      (<span class="progress-percent">46%</span>)
    </p>
    <p class="progress-details">
      ✓ <span class="imported-count">20</span> imported
      ⊘ <span class="duplicate-count">3</span> duplicates
      ✗ <span class="error-count">0</span> errors
    </p>
  </div>
</div>
```

### JavaScript API

#### `showProgress(session: ImportSession): void`

Displays progress modal with initial state.

**Parameters**:
```typescript
interface ImportSession {
  id: number;
  total_files: number;
  processed_files: number;
  imported_count: number;
  duplicate_count: number;
  error_count: number;
}
```

**Example**:
```javascript
import { showProgress } from '@/ui/progress.js';

const session = await importService.startImport(files);
showProgress(session);
```

---

#### `updateProgress(session: ImportSession): void`

Updates progress UI with current import state.

**Behavior**:
1. Update progress bar width (percentage)
2. Update file counts
3. Update percentage text
4. If `processed_files === total_files`, show completion message

**Example**:
```javascript
// Called during import loop
for (const file of files) {
  await importPhoto(file);
  session.processed_files++;
  updateProgress(session);
}
```

---

#### `hideProgress(): void`

Hides progress modal.

**Example**:
```javascript
await importService.completeImport(sessionId);
hideProgress();
```

---

### CSS Classes

```css
.progress-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.progress-content {
  background: white;
  padding: 32px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
}

.progress-bar {
  width: 100%;
  height: 24px;
  background: #e0e0e0;
  border-radius: 12px;
  overflow: hidden;
  margin: 16px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(to right, #4caf50, #8bc34a);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 8px 0;
}

.progress-details {
  font-size: 14px;
  color: #666;
  text-align: center;
  margin: 8px 0;
}
```

---

## Component: ConfirmationModal

### Purpose
Shows confirmation dialog for destructive actions (delete photo/album).

### HTML Structure
```html
<div id="confirm-modal" class="modal" role="dialog" aria-labelledby="modal-title">
  <div class="modal-content">
    <h2 id="modal-title">Delete Album?</h2>
    <p id="modal-message">This will permanently delete "January 2024" and all 15 photos. This action cannot be undone.</p>
    <div class="modal-actions">
      <button id="modal-cancel" class="btn btn-secondary">Cancel</button>
      <button id="modal-confirm" class="btn btn-danger">Delete</button>
    </div>
  </div>
</div>
```

### JavaScript API

#### `showConfirmation(title: string, message: string): Promise<boolean>`

Shows confirmation modal and returns user choice.

**Parameters**:
- `title`: Modal title (e.g., "Delete Album?")
- `message`: Detailed message (e.g., "This will permanently delete...")

**Returns**: `Promise<boolean>` - true if confirmed, false if canceled

**Example**:
```javascript
import { showConfirmation } from '@/ui/modal.js';

const confirmed = await showConfirmation(
  'Delete Album?',
  'This will permanently delete "January 2024" and all 15 photos. This action cannot be undone.'
);

if (confirmed) {
  await albumService.deleteAlbum(albumId);
}
```

---

### CSS Classes

```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 8px;
  min-width: 400px;
  max-width: 600px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover {
  background: #d32f2f;
}
```

---

## Component: Navigation

### Purpose
Handles client-side routing for single-page application.

### JavaScript API

#### `navigateTo(route: string, params?: object): void`

Navigates to route without page reload.

**Routes**:
- `/` → Album list view
- `/album/:id` → Album detail view (photo grid)

**Example**:
```javascript
import { navigateTo } from '@/ui/navigation.js';

// Navigate to album detail
navigateTo('/album/1');

// Navigate back to album list
navigateTo('/');
```

---

#### `onRouteChange(handler: (route: string, params: object) => void): void`

Registers handler for route changes.

**Example**:
```javascript
import { onRouteChange } from '@/ui/navigation.js';

onRouteChange((route, params) => {
  if (route === '/') {
    // Render album list
    const albums = await albumService.getAllAlbums();
    renderAlbumList(albums);
  } else if (route === '/album/:id') {
    // Render photo grid
    const photos = await photoService.getPhotosInAlbum(params.id);
    renderPhotoGrid(photos);
  }
});
```

---

## Accessibility Compliance (WCAG 2.1 AA)

All components meet WCAG 2.1 AA requirements:

### Keyboard Navigation
- All interactive elements accessible via Tab key
- Enter/Space to activate buttons
- Escape to close modals
- Arrow keys for grid navigation (optional enhancement)

### Screen Reader Support
- ARIA labels for all UI regions
- ARIA roles for custom components
- Live regions for progress updates (`aria-live="polite"`)
- Focus management (modal traps focus)

### Color Contrast
- Text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: Clear focus indicators

### Focus Indicators
```css
*:focus {
  outline: 2px solid #4caf50;
  outline-offset: 2px;
}

button:focus-visible {
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.3);
}
```

---

## Performance Requirements

From spec (Performance Requirements section):

| Component | Target | Implementation |
|-----------|--------|----------------|
| **AlbumList** | <1.5s for 100 albums | Virtual scrolling, lazy image loading |
| **PhotoGrid** | <2s for 50 photos | Lazy loading, IntersectionObserver |
| **Drag-and-Drop** | 60fps (16.67ms/frame) | `requestAnimationFrame`, `transform: translate3d()` |
| **Progress** | Real-time updates | Debounce updates (max 10/sec) |

---

## Testing Strategy

**Contract Tests** (using Web Test Runner):

```javascript
// tests/contract/ui-components.test.js
import { renderAlbumList, createAlbumCard } from '@/ui/album-list.js';

describe('AlbumList Component', () => {
  it('should render album cards', () => {
    const albums = [
      { id: 1, title: 'January 2024', photo_count: 15 }
    ];
    renderAlbumList(albums);
    
    const cards = document.querySelectorAll('.album-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('January 2024');
  });

  it('should attach drag handlers', () => {
    const card = createAlbumCard({ id: 1, title: 'Test' });
    expect(card.draggable).toBe(true);
    expect(card.hasAttribute('data-album-id')).toBe(true);
  });
});
```

**Accessibility Tests**:
```javascript
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  renderAlbumList(albums);
  const results = await axe(document.body);
  expect(results).toHaveNoViolations();
});
```

---

## Summary

This UI component contract defines:
- **AlbumList**: Grid with drag-and-drop reordering (60fps)
- **PhotoGrid**: Lazy-loaded thumbnails (<2s for 50 photos)
- **ProgressIndicator**: Real-time import progress
- **ConfirmationModal**: Destructive action confirmation
- **Navigation**: Client-side routing
- **Accessibility**: WCAG 2.1 AA compliance
- **Performance**: GPU-accelerated animations, lazy loading

**Next Steps**: Implement components in `src/ui/*.js` and create contract tests in `tests/contract/ui-components.test.js`.
