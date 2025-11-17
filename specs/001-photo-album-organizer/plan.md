# Implementation Plan: Photo Album Organizer

**Branch**: `001-photo-album-organizer` | **Date**: 2025-11-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-photo-album-organizer/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Build a desktop web application for organizing photos into date-based albums with drag-and-drop customization and tile-based photo browsing. Photos are stored locally with metadata tracked in SQLite. The application uses Vite with vanilla HTML, CSS, and JavaScript to minimize dependencies while delivering responsive performance for libraries up to 10,000+ photos.

**Core Requirements**:

- Auto-group photos into monthly albums based on EXIF date metadata
- Tile-based photo viewing (300x300px thumbnails) within albums
- Drag-and-drop album reordering with persistence
- Photo import from local storage with hash-based duplicate detection
- Photo/album deletion with permanent file removal
- WCAG 2.1 AA accessibility compliance

**Technical Approach**: Single-page web application using Vite build tooling, vanilla JavaScript for UI logic, SQLite for metadata storage (albums, photos, ordering), and local file system for photo storage. Minimal external dependencies to maintain simplicity and performance.

## Technical Context

**Language/Version**: JavaScript ES2022+ (modern browser targets: Chrome 90+, Firefox 88+, Safari 14+)  
**Primary Dependencies**:

- Vite 5.x (build tool and dev server)
- better-sqlite3 (SQLite database driver for Node.js)
- exifreader (EXIF metadata extraction from images)
- Vitest (testing framework, Vite-native)

**Storage**:

- SQLite database (local file) for metadata (albums, photos, custom ordering, import sessions)
- Local file system for original photos and generated thumbnails
- IndexedDB fallback for browser-side thumbnail caching (optional optimization)

**Testing**:

- Vitest for unit tests (album grouping, hash calculation, date parsing)
- Playwright for integration tests (UI workflows, drag-drop, navigation)
- Web Test Runner for contract tests (file system APIs, database operations)

**Target Platform**: Desktop web application (Electron wrapper possible for future native packaging)

**Project Type**: Single web application (frontend-focused with Node.js backend for file/database operations)

**Performance Goals**:

- Album list rendering: First paint <1.5s for 100 albums
- Photo tile rendering: 50 thumbnails in <2s
- Drag-and-drop: 60fps (16.67ms frame time), <50ms input response
- Photo import: ≥5 photos/second with thumbnail generation
- Database queries: <50ms for album/photo retrieval

**Constraints**:

- Memory usage: <200MB for 1000 loaded photos
- No cloud storage or external services (fully local/offline)
- Accessibility: WCAG 2.1 Level AA (keyboard navigation, ARIA labels, screen reader support)
- Browser compatibility: Modern evergreen browsers (no IE11 support)

**Scale/Scope**:

- Target capacity: 10,000+ photos without UI degradation
- Typical album size: 50-200 photos per month
- Expected concurrent operations: Single user, sequential imports
- Database size estimate: ~50KB per 1000 photos (metadata only)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Principle I - Code Quality First**:

- [x] Code style guide identified and documented above - ESLint + Prettier for JavaScript
- [x] Error handling strategy defined - Try-catch blocks for file I/O, database operations; user-facing error messages for all failures
- [x] Function size and complexity guidelines established - Functions <50 lines; modular photo processing, album grouping, drag-drop state management

**Principle II - Test-Driven Development (NON-NEGOTIABLE)**:

- [x] Testing framework identified and documented above - Vitest (unit), Playwright (integration), Web Test Runner (contract)
- [x] Test coverage target ≥80% confirmed - All business logic (album grouping, duplicate detection, EXIF parsing, ordering persistence)
- [x] Unit, integration, and contract test strategy defined - See Testing section above
- [x] Test execution time targets (<30s unit, <5min integration) achievable - Vitest runs in parallel; Playwright targets specific workflows

**Principle III - User Experience Consistency**:

- [x] CLI/UI interaction patterns defined - N/A for CLI; Web UI uses standard patterns (buttons, drag handles, confirmation dialogs)
- [x] Error message format standardized - "Action failed: [reason]. [Suggested fix]" (e.g., "Could not import photo.jpg: unsupported format. Supported: JPEG, PNG, HEIC, WebP")
- [x] Input/output formats specified (JSON + human-readable) - N/A (web UI only); database stores structured data
- [x] Accessibility requirements identified (if UI/web/mobile) - WCAG 2.1 AA: keyboard navigation, ARIA labels, focus management, alt text for images
- [x] Response time expectations documented - <200ms drag feedback, <1.5s first paint, <2s photo tiles, <50ms database queries

**Principle IV - Performance Requirements**:

- [x] Performance goals documented above and aligned with constitution targets - UI <1.5s first paint, tiles <2s, 60fps drag
- [x] Resource constraints (memory, CPU) defined - <200MB memory for 1000 photos; CPU usage minimized via thumbnail caching
- [x] Scalability requirements specified - Support 10,000+ photos; indexed database queries
- [x] Performance testing plan included in workflow - Playwright performance traces, Lighthouse audits, manual testing with large datasets

**All gates PASSED** ✅ - No constitution violations. Ready for Phase 0 research.

## Project Structure

### Documentation (this feature)

```text
specs/001-photo-album-organizer/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   ├── database-schema.sql
│   ├── file-system-api.md
│   └── ui-components.md
├── checklists/
│   └── requirements.md  # Spec validation checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
photo-album-organizer/
├── index.html                 # Main entry point
├── vite.config.js             # Vite configuration
├── package.json               # Dependencies and scripts
├── .eslintrc.json             # ESLint configuration (StandardJS)
├── .prettierrc.json           # Prettier configuration
│
├── src/
│   ├── main.js                # Application initialization
│   ├── styles/
│   │   ├── main.css           # Global styles
│   │   ├── albums.css         # Album list styles
│   │   ├── photos.css         # Photo grid styles
│   │   └── components.css     # Reusable component styles
│   │
│   ├── lib/
│   │   ├── database.js        # SQLite database operations
│   │   ├── file-system.js     # File I/O operations
│   │   ├── hash.js            # File hash calculation (duplicate detection)
│   │   ├── exif.js            # EXIF metadata extraction
│   │   ├── thumbnail.js       # Thumbnail generation
│   │   └── date-utils.js      # Date parsing and timezone handling
│   │
│   ├── services/
│   │   ├── album-service.js   # Album CRUD and grouping logic
│   │   ├── photo-service.js   # Photo CRUD and ordering logic
│   │   ├── import-service.js  # Photo import workflow
│   │   └── delete-service.js  # Deletion operations
│   │
│   ├── ui/
│   │   ├── album-list.js      # Album grid component
│   │   ├── photo-grid.js      # Photo tile grid component
│   │   ├── drag-drop.js       # Drag-and-drop controller
│   │   ├── modal.js           # Confirmation dialog component
│   │   ├── progress.js        # Progress indicator component
│   │   └── navigation.js      # Navigation/routing
│   │
│   └── data/
│       └── schema.sql         # SQLite database schema
│
├── public/
│   ├── icons/                 # App icons and UI assets
│   └── sample-photos/         # Sample data for development
│
├── storage/                   # Runtime storage (not committed)
│   ├── photos/                # Original photos (user data)
│   ├── thumbnails/            # Generated 300x300 thumbnails
│   └── metadata.db            # SQLite database file
│
└── tests/
    ├── unit/
    │   ├── album-service.test.js
    │   ├── photo-service.test.js
    │   ├── hash.test.js
    │   ├── exif.test.js
    │   └── date-utils.test.js
    │
    ├── integration/
    │   ├── import-workflow.test.js
    │   ├── album-navigation.test.js
    │   ├── drag-drop.test.js
    │   └── delete-workflow.test.js
    │
    └── contract/
        ├── database.test.js
        ├── file-system.test.js
        └── ui-components.test.js
```

**Structure Decision**: Selected **single web application** structure as this is a frontend-focused desktop web app. The application uses:

- **Vite** for development server and build tooling (fast HMR, optimized production builds)
- **Vanilla JavaScript modules** in `/src/lib/` and `/src/services/` for business logic
- **UI components** in `/src/ui/` for view layer (no framework - direct DOM manipulation)
- **SQLite database** accessed via Node.js backend module (`src/lib/database.js`)
- **Local file system** for photo storage managed by `src/lib/file-system.js`
- **Three-layer testing**: unit (business logic), integration (workflows), contract (external dependencies)

This structure supports the "minimal libraries, vanilla JS" requirement while maintaining clear separation of concerns for testability and maintainability.

## Complexity Tracking

**N/A** - No constitution violations or deviations detected. All requirements align with established principles (Code Quality First, TDD, UX Consistency, Performance). No additional complexity tracking needed.

---

## Post-Design Constitution Verification

**Phase 1 Complete** - Re-evaluation after generating data model, contracts, and quickstart documentation.

### Verification Against Constitution Principles

#### Principle I: Code Quality First ✅

- **Data Model**: Clear entity definitions with validation rules and state transitions
- **Contracts**: Explicit API contracts for database, file system, and UI components
- **Testing Strategy**: Contract tests defined for all external dependencies
- **Documentation**: Comprehensive quickstart guide with troubleshooting
- **Alignment**: All artifacts meet code quality standards

#### Principle II: TDD NON-NEGOTIABLE ✅

- **Database Schema**: Includes query examples and trigger definitions for testing
- **File System API**: Test examples provided for all operations (hash calculation, duplicate detection)
- **UI Components**: Contract tests and accessibility tests defined
- **Coverage Target**: ≥80% maintained across all test layers
- **Alignment**: Test-first approach embedded in all contracts

#### Principle III: UX Consistency ✅

- **UI Components**: WCAG 2.1 AA compliance documented for all components
- **Error Handling**: Consistent error message format across file system API
- **Accessibility**: Keyboard navigation, screen reader support, focus management defined
- **Performance**: Lazy loading, GPU acceleration for smooth UX (60fps drag-and-drop)
- **Alignment**: User experience requirements met in all UI contracts

#### Principle IV: Performance Requirements ✅

- **Database Indexes**: Optimized for query performance (<1.5s album list, <2s photo tiles)
- **File Operations**: Streaming copy, parallel hash calculation (≥5 photos/sec import)
- **UI Rendering**: Virtual scrolling, IntersectionObserver lazy loading
- **Memory Constraints**: <200MB for 1000 photos achieved via thumbnail caching
- **Alignment**: All performance targets defined in contracts and quickstart

### Constitution Gates: Re-Evaluation

- [x] **Code Quality**: ESLint + Prettier configs defined, testing strategies documented
- [x] **TDD**: Test-first workflow enforced via quickstart guide, contract tests for all APIs
- [x] **UX Consistency**: WCAG 2.1 AA compliance, error handling patterns, focus management
- [x] **Performance**: Benchmarks documented in quickstart, optimization strategies in contracts

**Final Assessment**: ✅ **ALL GATES PASSED** - No constitution violations in Phase 1 design artifacts. Ready to proceed to Phase 2 (tasks generation via `/speckit.tasks` command).

---

## Phase 1 Summary

**Completed Artifacts**:

1. ✅ **research.md** - Technical decisions for Vite+SQLite, EXIF parsing, file hashing, drag-drop, thumbnails
2. ✅ **data-model.md** - 4 entities (Album, Photo, AlbumOrder, ImportSession) with validation rules
3. ✅ **contracts/database-schema.sql** - Complete SQLite schema with triggers and indexes
4. ✅ **contracts/file-system-api.md** - File operations API with performance targets
5. ✅ **contracts/ui-components.md** - 5 UI components with accessibility requirements
6. ✅ **quickstart.md** - Setup guide, dev workflow, troubleshooting, deployment

**Key Decisions Documented**:

- **Architecture**: Tauri v1.5+ with Vite (smallest bundle, native SQLite access)
- **EXIF Parsing**: exifreader v4.x (browser-compatible, timezone support)
- **File Hashing**: Web Crypto API SHA-256 (native, no library needed)
- **Drag-and-Drop**: Vanilla JS + `transform: translate3d()` (GPU-accelerated, 60fps)
- **Thumbnails**: Canvas API + file cache (lazy generation, meets <2s target)

**Next Steps**:

- Run `/speckit.tasks` command to generate `tasks.md` with implementation checklist
- Tasks will reference contracts and data model for implementation guidance
- All constitution gates remain PASSED ✅
