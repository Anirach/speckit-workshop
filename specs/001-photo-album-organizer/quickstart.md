# Quickstart Guide: Photo Album Organizer

**Feature**: 001-photo-album-organizer  
**Date**: 2025-01-17  
**Version**: 1.0

---

## Prerequisites

- **Node.js**: 18.x or later (for Vite and better-sqlite3)
- **Tauri**: v1.5+ (if using Tauri for native file system access)
- **Operating System**: macOS, Windows, or Linux

---

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd photo-album-organizer
git checkout 001-photo-album-organizer
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Vite** 5.x (dev server and build tool)
- **better-sqlite3** (SQLite database)
- **exifreader** (EXIF metadata extraction)
- **Vitest** (unit testing)
- **Playwright** (integration testing)
- **@web/test-runner** (contract testing)
- **ESLint** and **Prettier** (code quality)

### 3. Initialize Database

```bash
npm run db:init
```

This creates the SQLite database schema at `storage/metadata.db` using the schema defined in `src/data/schema.sql`.

### 4. Create Storage Directories

```bash
mkdir -p storage/photos
mkdir -p storage/thumbnails
```

---

## Development Workflow

### Start Development Server

```bash
npm run dev
```

This starts the Vite dev server at `http://localhost:5173` with:
- Hot Module Replacement (HMR) for instant updates
- Fast refresh on file changes
- Source maps for debugging

**Expected Output**:
```
VITE v5.0.0  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Run Tests

#### Unit Tests (Vitest)

```bash
npm run test:unit
```

Tests business logic in `src/lib/` and `src/services/`.

**Target**: <30s total, ≥80% coverage

#### Integration Tests (Playwright)

```bash
npm run test:integration
```

Tests full workflows (import, drag-drop, delete).

**Target**: <5min total

#### Contract Tests (Web Test Runner)

```bash
npm run test:contract
```

Tests external dependencies (database, file system, UI components).

#### All Tests

```bash
npm test
```

Runs all three test suites in sequence.

### Run Linters

#### ESLint (Code Quality)

```bash
npm run lint
```

Checks code against StandardJS style guide.

#### Prettier (Code Formatting)

```bash
npm run format
```

Auto-formats all JavaScript, CSS, and HTML files.

### Build for Production

```bash
npm run build
```

Generates optimized production bundle in `dist/`:
- Minified JavaScript
- Tree-shaken dependencies
- Optimized CSS
- Source maps (for debugging)

**Expected Output**:
```
vite v5.0.0 building for production...
✓ 47 modules transformed.
dist/index.html                0.45 kB
dist/assets/index-abc123.js   45.32 kB │ gzip: 15.21 kB
dist/assets/index-def456.css   8.12 kB │ gzip:  2.45 kB
✓ built in 1.23s
```

### Preview Production Build

```bash
npm run preview
```

Serves production build locally at `http://localhost:4173` for testing.

---

## Project Structure

```text
photo-album-organizer/
├── index.html                # Entry point
├── vite.config.js            # Vite configuration
├── package.json              # Dependencies and scripts
├── .eslintrc.json            # ESLint rules
├── .prettierrc.json          # Prettier config
│
├── src/
│   ├── main.js               # App initialization
│   ├── styles/               # CSS files
│   ├── lib/                  # Core libraries
│   │   ├── database.js       # SQLite operations
│   │   ├── file-system.js    # File I/O
│   │   ├── hash.js           # SHA-256 hashing
│   │   ├── exif.js           # EXIF parsing
│   │   └── thumbnail.js      # Thumbnail generation
│   │
│   ├── services/             # Business logic
│   │   ├── album-service.js  # Album CRUD
│   │   ├── photo-service.js  # Photo CRUD
│   │   ├── import-service.js # Import workflow
│   │   └── delete-service.js # Deletion logic
│   │
│   ├── ui/                   # UI components
│   │   ├── album-list.js     # Album grid
│   │   ├── photo-grid.js     # Photo tiles
│   │   ├── drag-drop.js      # Drag-and-drop
│   │   ├── modal.js          # Dialogs
│   │   ├── progress.js       # Progress indicator
│   │   └── navigation.js     # Routing
│   │
│   └── data/
│       └── schema.sql        # Database schema
│
├── storage/                  # Runtime data (not committed)
│   ├── photos/               # Original photos
│   ├── thumbnails/           # Generated 300x300 thumbnails
│   └── metadata.db           # SQLite database
│
└── tests/
    ├── unit/                 # Vitest unit tests
    ├── integration/          # Playwright E2E tests
    └── contract/             # Web Test Runner contract tests
```

---

## Common Tasks

### Import Sample Photos

For development/testing, you can import sample photos:

```bash
# Copy sample photos to test import
cp -r public/sample-photos/* ~/Downloads/test-photos/

# Then use the app's import button to import from ~/Downloads/test-photos/
```

### Reset Database

To start fresh (deletes all albums and photos):

```bash
npm run db:reset
```

⚠️ **Warning**: This permanently deletes all data!

### View Database Contents

```bash
npm run db:shell
```

Opens SQLite shell for manual queries:

```sql
-- View all albums
SELECT * FROM Album ORDER BY year DESC, month DESC;

-- View photo count by album
SELECT a.title, COUNT(p.id) as photo_count
FROM Album a
LEFT JOIN Photo p ON a.id = p.album_id
GROUP BY a.id;

-- View import sessions
SELECT * FROM ImportSession ORDER BY started_at DESC;
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Generates HTML coverage report in `coverage/` directory.

**Target**: ≥80% coverage for all modules

### Debug Tests

```bash
# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test:unit -- src/lib/hash.test.js

# Run tests with debugging output
npm run test:unit -- --reporter=verbose
```

---

## Environment Variables

Create `.env` file in project root:

```bash
# Database path
VITE_DB_PATH=storage/metadata.db

# Storage directories
VITE_PHOTOS_DIR=storage/photos
VITE_THUMBNAILS_DIR=storage/thumbnails

# Performance tuning
VITE_BATCH_SIZE=5          # Photos to process in parallel
VITE_THUMBNAIL_QUALITY=0.85 # JPEG quality (0-1)
VITE_LAZY_LOAD_MARGIN=200px # IntersectionObserver margin
```

---

## Troubleshooting

### Issue: "Cannot find module 'better-sqlite3'"

**Solution**:
```bash
# Rebuild native modules
npm rebuild better-sqlite3
```

### Issue: "Database is locked"

**Solution**: Close all connections before opening new ones:
```javascript
// In src/lib/database.js
const db = new Database('storage/metadata.db');
process.on('exit', () => db.close());
```

### Issue: "Out of memory during import"

**Solution**: Reduce batch size in `.env`:
```bash
VITE_BATCH_SIZE=3  # Process fewer photos in parallel
```

### Issue: Thumbnails not loading

**Solution**: Check file permissions:
```bash
chmod -R 755 storage/thumbnails/
```

### Issue: Tests timing out

**Solution**: Increase timeout in test config:
```javascript
// vitest.config.js
export default {
  test: {
    testTimeout: 30000, // 30 seconds
  },
};
```

---

## Performance Benchmarks

Expected performance on modern hardware (2020+ laptop):

| Operation | Target | Typical |
|-----------|--------|---------|
| **Dev server start** | <5s | 2-3s |
| **HMR update** | <500ms | 100-200ms |
| **Unit tests** | <30s | 15-20s |
| **Integration tests** | <5min | 2-3min |
| **Production build** | <10s | 5-8s |
| **Import 100 photos** | <20s | 12-15s |
| **Load 100 albums** | <1.5s | 0.8-1.2s |
| **Load 50 photo tiles** | <2s | 1.2-1.8s |

If performance is significantly worse, check:
1. Node.js version (18.x+ required)
2. Disk I/O speed (SSD recommended)
3. Available memory (≥8GB recommended)

---

## Deployment

### Package as Desktop App (Tauri)

```bash
# Build Tauri app
npm run tauri:build
```

Generates platform-specific installer in `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` and `.app`
- **Windows**: `.exe` and `.msi`
- **Linux**: `.deb` and `.AppImage`

### Web Deployment (Static Hosting)

```bash
# Build for web
npm run build

# Deploy to hosting service (e.g., Netlify, Vercel)
# Upload contents of dist/ folder
```

⚠️ **Note**: Web deployment requires backend API for file system and database access (not included in this spec).

---

## Next Steps

1. **Read the specification**: `specs/001-photo-album-organizer/spec.md`
2. **Review the data model**: `specs/001-photo-album-organizer/data-model.md`
3. **Check the contracts**: `specs/001-photo-album-organizer/contracts/`
4. **Start development**: `npm run dev`
5. **Write tests first**: Follow TDD workflow (see constitution.md)

---

## Resources

- **Vite Documentation**: https://vitejs.dev
- **better-sqlite3 Docs**: https://github.com/WiseLibs/better-sqlite3
- **exifreader Docs**: https://github.com/mattiasw/ExifReader
- **Vitest Docs**: https://vitest.dev
- **Playwright Docs**: https://playwright.dev
- **Web Test Runner Docs**: https://modern-web.dev/docs/test-runner/overview/

---

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review constitution.md for development workflow
3. Check spec.md for functional requirements
4. Review plan.md for technical decisions

---

**Last Updated**: 2025-01-17  
**Version**: 1.0
