# Data Model: Photo Album Organizer

**Feature**: 001-photo-album-organizer  
**Date**: 2025-01-17  
**Phase**: 1 (Design & Contracts)

---

## Entity Overview

This data model supports the Photo Album Organizer feature with the following entities:

1. **Album** - Collections of photos grouped by date
2. **Photo** - Individual photo files with metadata
3. **AlbumOrder** - Custom ordering of albums on main page
4. **ImportSession** - Tracking for photo import operations

---

## Entity: Album

### Description

Represents a photo album grouped by date (year-month). Albums are created automatically during photo import based on EXIF date metadata.

### Fields

| Field              | Type    | Constraints                                  | Description                                |
| ------------------ | ------- | -------------------------------------------- | ------------------------------------------ |
| `id`               | INTEGER | PRIMARY KEY, AUTO_INCREMENT                  | Unique album identifier                    |
| `title`            | TEXT    | NOT NULL                                     | Album display title (e.g., "January 2024") |
| `year`             | INTEGER | NOT NULL                                     | Year extracted from photos (e.g., 2024)    |
| `month`            | INTEGER | NOT NULL, CHECK (month >= 1 AND month <= 12) | Month extracted from photos (1-12)         |
| `cover_photo_id`   | INTEGER | NULLABLE, FOREIGN KEY → Photo.id             | ID of photo used as album cover thumbnail  |
| `photo_count`      | INTEGER | NOT NULL, DEFAULT 0                          | Cached count of photos in album            |
| `date_range_start` | TEXT    | NULLABLE, ISO8601                            | Earliest photo date in album               |
| `date_range_end`   | TEXT    | NULLABLE, ISO8601                            | Latest photo date in album                 |
| `created_at`       | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP          | Album creation timestamp                   |
| `updated_at`       | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP          | Last modification timestamp                |

### Relationships

- **One-to-Many**: Album → Photo (one album contains many photos)
- **One-to-One**: Album → AlbumOrder (custom ordering on main page)

### Validation Rules

1. **Unique constraint**: `(year, month)` combination must be unique
2. **Cover photo**: If `cover_photo_id` is set, must reference existing Photo in same album
3. **Photo count**: Must match actual count of photos with `album_id = this.id`
4. **Date range**: `date_range_end >= date_range_start` (if both non-null)

### State Transitions

```
[Created] → Initial state after first photo import for year-month
     ↓
[Active] → Album contains 1+ photos
     ↓
[Empty] → All photos deleted (photo_count = 0)
     ↓
[Deleted] → Album removed from database (cascade delete photos)
```

---

## Entity: Photo

### Description

Represents an individual photo file with metadata extracted from EXIF and file system.

### Fields

| Field               | Type    | Constraints                                         | Description                                 |
| ------------------- | ------- | --------------------------------------------------- | ------------------------------------------- |
| `id`                | INTEGER | PRIMARY KEY, AUTO_INCREMENT                         | Unique photo identifier                     |
| `album_id`          | INTEGER | NOT NULL, FOREIGN KEY → Album.id, ON DELETE CASCADE | Parent album reference                      |
| `file_path`         | TEXT    | NOT NULL, UNIQUE                                    | Absolute path to original photo file        |
| `file_name`         | TEXT    | NOT NULL                                            | Original filename (e.g., "IMG_1234.jpg")    |
| `file_hash`         | TEXT    | NOT NULL, UNIQUE                                    | SHA-256 hash for duplicate detection        |
| `file_size`         | INTEGER | NOT NULL                                            | File size in bytes                          |
| `mime_type`         | TEXT    | NOT NULL                                            | MIME type (e.g., "image/jpeg", "image/png") |
| `width`             | INTEGER | NULLABLE                                            | Image width in pixels                       |
| `height`            | INTEGER | NULLABLE                                            | Image height in pixels                      |
| `date_taken`        | TEXT    | NOT NULL, ISO8601                                   | Photo capture date with timezone            |
| `timezone_offset`   | TEXT    | NULLABLE                                            | Original timezone (e.g., "+08:00")          |
| `camera_model`      | TEXT    | NULLABLE                                            | Camera model from EXIF                      |
| `thumbnail_path`    | TEXT    | NULLABLE                                            | Path to generated 300x300 thumbnail         |
| `display_order`     | INTEGER | NOT NULL, DEFAULT 0                                 | Order within album (0 = newest first)       |
| `import_session_id` | INTEGER | NULLABLE, FOREIGN KEY → ImportSession.id            | Import batch reference                      |
| `created_at`        | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Record creation timestamp                   |
| `updated_at`        | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                 | Last modification timestamp                 |

### Relationships

- **Many-to-One**: Photo → Album (many photos belong to one album)
- **Many-to-One**: Photo → ImportSession (many photos belong to one import batch)

### Validation Rules

1. **File path**: Must be absolute path, file must exist on disk
2. **File hash**: SHA-256 format (64 hex characters)
3. **MIME type**: Must be one of: `image/jpeg`, `image/png`, `image/heic`, `image/heif`
4. **Dimensions**: Both width and height must be > 0 if present
5. **Date taken**: Must be valid ISO8601 timestamp
6. **Display order**: 0 = newest first (descending `date_taken`)

### State Transitions

```
[Imported] → Photo added during import session
     ↓
[Processed] → Thumbnail generated, metadata extracted
     ↓
[Visible] → Displayed in album photo grid
     ↓
[Deleted] → Permanently removed from disk and database
```

**Edge Case - Duplicate Detection**:

- If `file_hash` matches existing photo → skip import, show "duplicate" message
- Hash collision (same hash, different content) → extremely unlikely with SHA-256, treat as duplicate

---

## Entity: AlbumOrder

### Description

Stores custom ordering of albums on the main page after user drag-and-drop reordering.

### Fields

| Field        | Type    | Constraints                                            | Description                                     |
| ------------ | ------- | ------------------------------------------------------ | ----------------------------------------------- |
| `album_id`   | INTEGER | PRIMARY KEY, FOREIGN KEY → Album.id, ON DELETE CASCADE | Album reference                                 |
| `position`   | INTEGER | NOT NULL, UNIQUE                                       | Display position (0 = top-left, 1 = next, etc.) |
| `updated_at` | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                    | Last reorder timestamp                          |

### Relationships

- **One-to-One**: AlbumOrder → Album (each album has one position)

### Validation Rules

1. **Position uniqueness**: No two albums can have same position
2. **Position range**: `position >= 0`
3. **Position gaps**: Positions should be sequential (0, 1, 2, ...) with no gaps

### State Transitions

```
[Default] → Albums ordered by date (newest first) when no AlbumOrder records exist
     ↓
[Custom] → User drags album to new position → AlbumOrder record created/updated
     ↓
[Reordered] → All subsequent albums' positions adjusted (+1 or -1)
```

**Reordering Algorithm**:

```javascript
// When user drags album from oldPosition to newPosition:
if (newPosition > oldPosition) {
  // Shift albums between [oldPosition+1, newPosition] left by 1
  UPDATE AlbumOrder SET position = position - 1
  WHERE position > oldPosition AND position <= newPosition;
} else {
  // Shift albums between [newPosition, oldPosition-1] right by 1
  UPDATE AlbumOrder SET position = position + 1
  WHERE position >= newPosition AND position < oldPosition;
}
UPDATE AlbumOrder SET position = newPosition WHERE album_id = draggedAlbumId;
```

---

## Entity: ImportSession

### Description

Tracks photo import operations for batch processing, progress monitoring, and error handling.

### Fields

| Field             | Type    | Constraints                                                        | Description                     |
| ----------------- | ------- | ------------------------------------------------------------------ | ------------------------------- |
| `id`              | INTEGER | PRIMARY KEY, AUTO_INCREMENT                                        | Unique session identifier       |
| `status`          | TEXT    | NOT NULL, CHECK (status IN ('in_progress', 'completed', 'failed')) | Import status                   |
| `total_files`     | INTEGER | NOT NULL, DEFAULT 0                                                | Total files selected for import |
| `processed_files` | INTEGER | NOT NULL, DEFAULT 0                                                | Files processed so far          |
| `imported_count`  | INTEGER | NOT NULL, DEFAULT 0                                                | Successfully imported photos    |
| `duplicate_count` | INTEGER | NOT NULL, DEFAULT 0                                                | Skipped duplicates              |
| `error_count`     | INTEGER | NOT NULL, DEFAULT 0                                                | Failed imports                  |
| `error_log`       | TEXT    | NULLABLE                                                           | JSON array of error messages    |
| `started_at`      | TEXT    | NOT NULL, DEFAULT CURRENT_TIMESTAMP                                | Import start timestamp          |
| `completed_at`    | TEXT    | NULLABLE                                                           | Import completion timestamp     |

### Relationships

- **One-to-Many**: ImportSession → Photo (one session imports many photos)

### Validation Rules

1. **Status**: Must be one of: `in_progress`, `completed`, `failed`
2. **Progress**: `processed_files <= total_files`
3. **Count sum**: `imported_count + duplicate_count + error_count = processed_files`
4. **Completion**: `completed_at` must be > `started_at` (if status = 'completed')

### State Transitions

```
[Created] → Session created, status = 'in_progress', total_files set
     ↓
[Processing] → Files processed, counters updated, photos created
     ↓
[Completed] → All files processed, status = 'completed', completed_at set
     ↓
[Failed] → Error occurred, status = 'failed', error_log populated
```

**Progress Calculation**:

```javascript
const progress = (session.processed_files / session.total_files) * 100
const rate = session.processed_files / ((Date.now() - new Date(session.started_at)) / 1000)
```

---

## Database Indexes

For optimal query performance:

```sql
-- Album queries
CREATE INDEX idx_album_year_month ON Album(year, month);
CREATE INDEX idx_album_created_at ON Album(created_at DESC);

-- Photo queries
CREATE INDEX idx_photo_album_id ON Photo(album_id);
CREATE INDEX idx_photo_file_hash ON Photo(file_hash);
CREATE INDEX idx_photo_date_taken ON Photo(date_taken DESC);
CREATE INDEX idx_photo_display_order ON Photo(album_id, display_order);

-- AlbumOrder queries
CREATE INDEX idx_album_order_position ON AlbumOrder(position);

-- ImportSession queries
CREATE INDEX idx_import_status ON ImportSession(status);
CREATE INDEX idx_import_started_at ON ImportSession(started_at DESC);
```

---

## Summary

This data model supports all functional requirements:

| Requirement                        | Entities Used        | Key Fields                             |
| ---------------------------------- | -------------------- | -------------------------------------- |
| **FR-001**: View albums by date    | Album                | `year`, `month`, `title`               |
| **FR-002**: Display photo count    | Album                | `photo_count`                          |
| **FR-005**: Custom album ordering  | AlbumOrder           | `position`                             |
| **FR-008**: Import photos          | Photo, ImportSession | `file_path`, `file_hash`, `date_taken` |
| **FR-014**: Duplicate detection    | Photo                | `file_hash`                            |
| **FR-015**: Progress tracking      | ImportSession        | `processed_files`, `total_files`       |
| **FR-019**: Delete photos/albums   | Photo, Album         | CASCADE deletion                       |
| **FR-024**: Photos by newest first | Photo                | `display_order`, `date_taken`          |

**Next Steps**: Use this data model to generate `contracts/database-schema.sql` with full table definitions and constraints.
