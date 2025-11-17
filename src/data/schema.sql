-- Photo Album Organizer - Database Schema
-- Feature: 001-photo-album-organizer
-- SQLite 3.35+

-- =============================================================================
-- Table: Album
-- =============================================================================
CREATE TABLE IF NOT EXISTS Album (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    cover_photo_id INTEGER,
    photo_count INTEGER NOT NULL DEFAULT 0,
    date_range_start TEXT,
    date_range_end TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    UNIQUE(year, month),
    FOREIGN KEY (cover_photo_id) REFERENCES Photo(id) ON DELETE SET NULL
);

-- =============================================================================
-- Table: Photo
-- =============================================================================
CREATE TABLE IF NOT EXISTS Photo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id INTEGER NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL UNIQUE,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/heic', 'image/heif')),
    width INTEGER,
    height INTEGER,
    date_taken TEXT NOT NULL,
    timezone_offset TEXT,
    camera_model TEXT,
    thumbnail_path TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    import_session_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE,
    FOREIGN KEY (import_session_id) REFERENCES ImportSession(id) ON DELETE SET NULL
);

-- =============================================================================
-- Table: AlbumOrder
-- =============================================================================
CREATE TABLE IF NOT EXISTS AlbumOrder (
    album_id INTEGER PRIMARY KEY,
    position INTEGER NOT NULL UNIQUE,
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    
    FOREIGN KEY (album_id) REFERENCES Album(id) ON DELETE CASCADE
);

-- =============================================================================
-- Table: ImportSession
-- =============================================================================
CREATE TABLE IF NOT EXISTS ImportSession (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
    total_files INTEGER NOT NULL DEFAULT 0,
    processed_files INTEGER NOT NULL DEFAULT 0,
    imported_count INTEGER NOT NULL DEFAULT 0,
    duplicate_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    error_log TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    completed_at TEXT
);

-- =============================================================================
-- Indexes for Performance
-- =============================================================================

-- Album indexes
CREATE INDEX IF NOT EXISTS idx_album_year_month ON Album(year, month);
CREATE INDEX IF NOT EXISTS idx_album_created_at ON Album(created_at DESC);

-- Photo indexes
CREATE INDEX IF NOT EXISTS idx_photo_album_id ON Photo(album_id);
CREATE INDEX IF NOT EXISTS idx_photo_file_hash ON Photo(file_hash);
CREATE INDEX IF NOT EXISTS idx_photo_date_taken ON Photo(date_taken DESC);
CREATE INDEX IF NOT EXISTS idx_photo_display_order ON Photo(album_id, display_order);

-- AlbumOrder indexes
CREATE INDEX IF NOT EXISTS idx_album_order_position ON AlbumOrder(position);

-- ImportSession indexes
CREATE INDEX IF NOT EXISTS idx_import_status ON ImportSession(status);
CREATE INDEX IF NOT EXISTS idx_import_started_at ON ImportSession(started_at DESC);

-- =============================================================================
-- Triggers for Data Integrity
-- =============================================================================

-- Trigger: Update Album.updated_at on any change
DROP TRIGGER IF EXISTS trg_album_updated_at;
CREATE TRIGGER trg_album_updated_at 
AFTER UPDATE ON Album
FOR EACH ROW
BEGIN
    UPDATE Album SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger: Update Photo.updated_at on any change
DROP TRIGGER IF EXISTS trg_photo_updated_at;
CREATE TRIGGER trg_photo_updated_at 
AFTER UPDATE ON Photo
FOR EACH ROW
BEGIN
    UPDATE Photo SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger: Increment Album.photo_count when Photo inserted
DROP TRIGGER IF EXISTS trg_photo_insert_count;
CREATE TRIGGER trg_photo_insert_count 
AFTER INSERT ON Photo
FOR EACH ROW
BEGIN
    UPDATE Album 
    SET photo_count = photo_count + 1 
    WHERE id = NEW.album_id;
END;

-- Trigger: Decrement Album.photo_count when Photo deleted
DROP TRIGGER IF EXISTS trg_photo_delete_count;
CREATE TRIGGER trg_photo_delete_count 
AFTER DELETE ON Photo
FOR EACH ROW
BEGIN
    UPDATE Album 
    SET photo_count = photo_count - 1 
    WHERE id = OLD.album_id;
END;

-- Trigger: Update Album.date_range_start/end when Photo inserted
DROP TRIGGER IF EXISTS trg_photo_insert_date_range;
CREATE TRIGGER trg_photo_insert_date_range 
AFTER INSERT ON Photo
FOR EACH ROW
BEGIN
    UPDATE Album 
    SET 
        date_range_start = CASE
            WHEN date_range_start IS NULL OR NEW.date_taken < date_range_start 
            THEN NEW.date_taken 
            ELSE date_range_start
        END,
        date_range_end = CASE
            WHEN date_range_end IS NULL OR NEW.date_taken > date_range_end 
            THEN NEW.date_taken 
            ELSE date_range_end
        END
    WHERE id = NEW.album_id;
END;

-- Trigger: Recalculate Album.date_range_start/end when Photo deleted
DROP TRIGGER IF EXISTS trg_photo_delete_date_range;
CREATE TRIGGER trg_photo_delete_date_range 
AFTER DELETE ON Photo
FOR EACH ROW
BEGIN
    UPDATE Album 
    SET 
        date_range_start = (SELECT MIN(date_taken) FROM Photo WHERE album_id = OLD.album_id),
        date_range_end = (SELECT MAX(date_taken) FROM Photo WHERE album_id = OLD.album_id)
    WHERE id = OLD.album_id;
END;

-- Trigger: Delete empty albums (photo_count = 0)
DROP TRIGGER IF EXISTS trg_album_delete_empty;
CREATE TRIGGER trg_album_delete_empty 
AFTER UPDATE OF photo_count ON Album
FOR EACH ROW
WHEN NEW.photo_count = 0
BEGIN
    DELETE FROM Album WHERE id = NEW.id;
END;
