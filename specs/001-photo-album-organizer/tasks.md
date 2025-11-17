# Tasks: Photo Album Organizer

**Feature**: 001-photo-album-organizer  
**Input**: plan.md, spec.md, research.md, data-model.md, contracts/  
**Generated**: 2025-11-17

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All file paths are relative to project root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

**Constitution Alignment**:

- Code quality tools (ESLint, Prettier) per Principle I
- Testing framework setup (Vitest, Playwright, Web Test Runner) per Principle II
- Development workflow per quickstart.md

- [x] T001 Create project root directory structure (src/, tests/, public/, storage/)
- [x] T002 Initialize Node.js project with package.json and dependencies (Vite 5.x, better-sqlite3, exifreader, Vitest, Playwright, @web/test-runner)
- [x] T003 [P] Configure ESLint with StandardJS style guide in .eslintrc.json (Principle I: Code Quality)
- [x] T004 [P] Configure Prettier for code formatting in .prettierrc.json (Principle I: Code Quality)
- [x] T005 [P] Setup Vite configuration in vite.config.js (dev server, build settings, HMR)
- [x] T006 [P] Setup Vitest configuration in vitest.config.js (unit test runner, coverage ≥80% target)
- [x] T007 [P] Setup Playwright configuration in playwright.config.js (integration tests, <5min target)
- [x] T008 [P] Setup Web Test Runner configuration in web-test-runner.config.js (contract tests)
- [x] T009 Create index.html entry point with basic HTML structure
- [x] T010 [P] Create main CSS structure in src/styles/main.css, albums.css, photos.css, components.css
- [x] T011 Create .gitignore for node_modules/, dist/, storage/, coverage/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Constitution Alignment**:

- Database schema with triggers (Principle I: Code Quality)
- Error handling infrastructure (Principle III: UX Consistency)
- Performance monitoring setup (Principle IV: Performance)
- Test infrastructure for all three layers (Principle II: TDD)

- [x] T012 Create SQLite database schema in src/data/schema.sql (copy from contracts/database-schema.sql)
- [x] T013 Implement database connection manager in src/lib/database.js (better-sqlite3, connection pooling, auto-close)
- [x] T014 [P] Implement file hash calculation in src/lib/hash.js (Web Crypto API SHA-256, 50-100 MB/s target)
- [x] T015 [P] Implement EXIF metadata extraction in src/lib/exif.js (exifreader, timezone preservation)
- [x] T016 [P] Implement thumbnail generation in src/lib/thumbnail.js (Canvas API, 300x300px, 0.85 quality)
- [x] T017 [P] Implement file system operations in src/lib/file-system.js (copy, delete, hash, directory management)
- [x] T018 [P] Implement date utilities in src/lib/date-utils.js (EXIF date parsing, timezone handling, ISO8601 conversion)
- [x] T019 Create database initialization script for npm run db:init (execute schema.sql)
- [x] T020 Create database reset script for npm run db:reset (drop all tables, re-execute schema)
- [x] T021 Setup npm scripts in package.json (dev, build, test, lint, format, db:init, db:reset)
- [x] T022 Create error handling utilities with user-friendly messages (Principle III: UX Consistency)
- [x] T023 Create main.js application entry point with initialization logic
- [x] T024 Implement client-side routing in src/ui/navigation.js (History API, route handling)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - View and Browse Photo Albums (Priority: P1) 🎯 MVP

**Goal**: Users can view all their photo albums organized by date and browse photos within each album using a tile-based preview interface.

**Independent Test**: Launch app with sample photos, verify albums appear grouped by date, click into album to see photo tiles, navigate back to album list. Complete browsing experience without editing features.

**Constitution Gate**: This story alone should deliver ≥80% test coverage for album/photo viewing (Principle II: TDD)

### Implementation for User Story 1

- [x] T025 [P] [US1] Implement AlbumService.getAllAlbums() in src/services/album-service.js (query Album table with ordering)
- [x] T026 [P] [US1] Implement AlbumService.getAlbumById() in src/services/album-service.js (query single album with metadata)
- [x] T027 [P] [US1] Implement PhotoService.getPhotosInAlbum() in src/services/photo-service.js (query Photo table by album_id, order by display_order)
- [x] T028 [US1] Implement album list UI in src/ui/album-list.js (renderAlbumList, createAlbumCard functions per contracts/ui-components.md)
- [x] T029 [US1] Implement photo grid UI in src/ui/photo-grid.js (renderPhotoGrid, createPhotoTile, lazy loading per contracts/ui-components.md)
- [x] T030 [US1] Implement navigation route handlers in src/ui/navigation.js (/ for album list, /album/:id for photo grid)
- [x] T031 [US1] Style album grid in src/styles/albums.css (grid layout, hover effects, responsive design)
- [x] T032 [US1] Style photo grid in src/styles/photos.css (tile layout, overlay effects, lazy loading indicators)
- [x] T033 [US1] Implement empty state UI for no albums (show instructions to import photos)
- [x] T034 [US1] Add ARIA labels and keyboard navigation for accessibility (WCAG 2.1 AA compliance, Principle III)
- [X] T035 [US1] Verify album list loads in <1.5s for 100 albums (Principle IV: Performance)
- [X] T036 [US1] Verify photo tiles load in <2s for 50 photos (Principle IV: Performance)

### Tests for User Story 1

- [X] T037 [P] [US1] Contract test for Album table queries in tests/contract/database.test.js (getAllAlbums, getAlbumById)
- [X] T038 [P] [US1] Contract test for Photo table queries in tests/contract/database.test.js (getPhotosInAlbum)
- [X] T039 [P] [US1] Contract test for AlbumList component in tests/contract/ui-components.test.js (rendering, ARIA labels)
- [X] T040 [P] [US1] Contract test for PhotoGrid component in tests/contract/ui-components.test.js (lazy loading, accessibility)
- [X] T041 [P] [US1] Unit test for AlbumService in tests/unit/album-service.test.js (getAllAlbums, getAlbumById logic)
- [X] T042 [P] [US1] Unit test for PhotoService in tests/unit/photo-service.test.js (getPhotosInAlbum, ordering logic)
- [X] T043 [US1] Integration test for album browsing workflow in tests/integration/album-navigation.test.js (click album → see photos → navigate back)
- [X] T044 [US1] Integration test for empty state in tests/integration/album-navigation.test.js (no albums → see instructions)
- [X] T045 [US1] Verify test coverage ≥80% for US1 files (Principle II: TDD)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can browse albums and photos.

---

## Phase 4: User Story 2 - Reorganize Albums via Drag and Drop (Priority: P2)

**Goal**: Users can manually reorder albums on the main page by dragging and dropping them to their preferred positions.

**Independent Test**: Open main page with multiple albums, drag one album to different position, verify new order persists when navigating away and back. Delivers personalization independently.

**Constitution Gate**: 60fps drag performance required (16.67ms per frame, Principle IV: Performance)

### Implementation for User Story 2

- [x] T046 [P] [US2] Implement AlbumService.updateAlbumOrder() in src/services/album-service.js (update AlbumOrder table positions)
- [x] T047 [P] [US2] Implement AlbumService.getAlbumsWithCustomOrder() in src/services/album-service.js (LEFT JOIN AlbumOrder, sort by position)
- [x] T048 [US2] Implement drag-and-drop controller in src/ui/drag-drop.js (mousedown, mousemove, mouseup handlers per research.md)
- [x] T049 [US2] Attach drag handlers to album cards in src/ui/album-list.js (attachDragHandlers function per contracts/ui-components.md)
- [x] T050 [US2] Implement position reordering algorithm in src/services/album-service.js (shift positions per data-model.md)
- [x] T051 [US2] Add GPU-accelerated drag animation in src/ui/drag-drop.js (transform: translate3d(), requestAnimationFrame)
- [x] T052 [US2] Add visual drop indicators in src/styles/albums.css (hover zones, placeholder elements)
- [x] T053 [US2] Implement drag cancel handling (Escape key, drop outside valid area)
- [x] T054 [US2] Persist album order to AlbumOrder table after drop
- [x] T055 [US2] Add keyboard shortcuts for reordering (Alt+Arrow keys for accessibility)
- [x] T056 [US2] Verify 60fps drag performance (16.67ms frame time, Principle IV: Performance)

### Tests for User Story 2

- [X] T057 [P] [US2] Contract test for AlbumOrder table operations in tests/contract/database.test.js (update, position shifting)
- [X] T058 [P] [US2] Contract test for drag-drop UI in tests/contract/ui-components.test.js (GPU acceleration, accessibility)
- [X] T059 [P] [US2] Unit test for position reordering logic in tests/unit/album-service.test.js (shift algorithm correctness)
- [X] T060 [US2] Integration test for drag-drop workflow in tests/integration/album-reordering.test.js (drag → drop → verify order → reload → verify persistence)
- [X] T061 [US2] Integration test for drag cancel in tests/integration/album-reordering.test.js (Escape key, invalid drop)
- [X] T062 [US2] Performance test for 60fps drag in tests/integration/album-reordering.test.js (measure frame times during drag)
- [X] T063 [US2] Verify test coverage ≥80% for US2 files (Principle II: TDD)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can browse and reorganize albums.

---

## Phase 5: User Story 3 - Import Photos into Albums (Priority: P3)

**Goal**: Users can import photos from their device storage, and the system automatically creates or adds to albums based on photo metadata (date taken).

**Independent Test**: Use import feature to add photos, verify they appear in date-appropriate albums, confirm they display in tile view. Complete photo ingestion workflow independently.

**Constitution Gate**: ≥5 photos/sec import rate required (Principle IV: Performance)

### Implementation for User Story 3

- [x] T064 [P] [US3] Implement ImportService.startImport() in src/services/import-service.js (create ImportSession, set total_files)
- [x] T065 [P] [US3] Implement ImportService.processPhoto() in src/services/import-service.js (extract EXIF, calculate hash, copy file, create thumbnail)
- [x] T066 [P] [US3] Implement ImportService.completeImport() in src/services/import-service.js (update session status, cleanup)
- [x] T067 [US3] Implement AlbumService.getOrCreateAlbum() in src/services/album-service.js (find by year-month or create new)
- [x] T068 [US3] Implement PhotoService.createPhoto() in src/services/photo-service.js (insert Photo record, trigger album updates)
- [x] T069 [US3] Implement duplicate detection in src/services/import-service.js (check file_hash, skip if exists)
- [x] T070 [US3] Implement progress indicator UI in src/ui/progress.js (showProgress, updateProgress, hideProgress per contracts/ui-components.md)
- [x] T071 [US3] Implement file picker UI with import button in src/ui/album-list.js (trigger file input, validate formats)
- [x] T072 [US3] Style progress modal in src/styles/components.css (modal overlay, progress bar, counters)
- [x] T073 [US3] Handle photos without EXIF date (fallback to file modification date for album grouping)
- [x] T074 [US3] Handle unsupported file formats (show error, continue with supported files)
- [x] T075 [US3] Implement batch processing with Web Workers for parallel hashing (5+ photos in parallel)
- [x] T076 [US3] Add error logging to ImportSession.error_log (JSON array of error messages)
- [X] T077 [US3] Verify ≥5 photos/sec import rate for 100 photos (Principle IV: Performance)

### Tests for User Story 3

- [X] T078 [P] [US3] Contract test for ImportSession table in tests/contract/database.test.js (create, update, status transitions)
- [X] T079 [P] [US3] Contract test for file operations in tests/contract/file-system.test.js (copyPhotoToStorage, calculateFileHash)
- [X] T080 [P] [US3] Contract test for EXIF extraction in tests/contract/file-system.test.js (extractMetadata, timezone preservation)
- [X] T081 [P] [US3] Contract test for thumbnail generation in tests/contract/file-system.test.js (generateThumbnail, cache storage)
- [X] T082 [P] [US3] Contract test for progress UI in tests/contract/ui-components.test.js (showProgress, updateProgress)
- [X] T083 [P] [US3] Unit test for duplicate detection in tests/unit/import-service.test.js (hash matching logic)
- [X] T084 [P] [US3] Unit test for album creation logic in tests/unit/album-service.test.js (getOrCreateAlbum)
- [X] T085 [P] [US3] Unit test for EXIF date parsing in tests/unit/date-utils.test.js (timezone handling, ISO8601 conversion)
- [X] T086 [P] [US3] Unit test for file hash calculation in tests/unit/hash.test.js (SHA-256 consistency, performance)
- [X] T087 [US3] Integration test for import workflow in tests/integration/photo-import.test.js (select files → import → verify albums → verify photos)
- [X] T088 [US3] Integration test for duplicate handling in tests/integration/photo-import.test.js (import same file twice → verify skip)
- [X] T089 [US3] Integration test for batch import in tests/integration/photo-import.test.js (100 photos → verify performance ≥5/sec)
- [X] T090 [US3] Verify test coverage ≥80% for US3 files (Principle II: TDD)

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can import, browse, and reorganize albums.

---

## Phase 6: User Story 4 - Delete Photos and Albums (Priority: P4)

**Goal**: Users can delete individual photos or entire albums to manage their photo library and free up space.

**Independent Test**: Select photos/albums and delete them, verify they're removed from interface and can't be accessed. Delivers complete cleanup functionality independently.

**Constitution Gate**: Permanent deletion with confirmation (Principle III: UX Consistency)

### Implementation for User Story 4

- [x] T091 [P] [US4] Implement PhotoService.deletePhoto() in src/services/photo-service.js (delete from DB, delete file, delete thumbnail)
- [x] T092 [P] [US4] Implement AlbumService.deleteAlbum() in src/services/album-service.js (cascade delete photos via trigger, delete AlbumOrder)
- [x] T093 [P] [US4] Implement DeleteService.deletePhotoWithConfirmation() in src/services/delete-service.js (show modal, handle response)
- [x] T094 [P] [US4] Implement DeleteService.deleteAlbumWithConfirmation() in src/services/delete-service.js (show modal with count, handle response)
- [x] T095 [US4] Implement confirmation modal UI in src/ui/modal.js (showConfirmation function per contracts/ui-components.md)
- [x] T096 [US4] Add delete button to photo tiles in src/ui/photo-grid.js (overlay button, trigger deletePhotoWithConfirmation)
- [x] T097 [US4] Add delete button to album cards in src/ui/album-list.js (corner button, trigger deleteAlbumWithConfirmation)
- [x] T098 [US4] Style confirmation modal in src/styles/components.css (modal overlay, buttons, danger state)
- [x] T099 [US4] Implement cascade deletion triggers in database schema (already in schema.sql, verify functionality)
- [x] T100 [US4] Update album list after deletion (remove card from DOM, refresh if needed)
- [x] T101 [US4] Update photo grid after deletion (remove tile from DOM, refresh if needed)
- [x] T102 [US4] Handle empty album deletion (delete album when last photo removed, verify trigger)
- [x] T103 [US4] Add keyboard shortcut for delete (Delete key with confirmation)

### Tests for User Story 4

- [X] T104 [P] [US4] Contract test for cascade deletion in tests/contract/database.test.js (delete album → verify photos deleted)
- [X] T105 [P] [US4] Contract test for file deletion in tests/contract/file-system.test.js (deletePhoto, deleteThumbnail)
- [X] T106 [P] [US4] Contract test for confirmation modal in tests/contract/ui-components.test.js (showConfirmation, accessibility)
- [X] T107 [P] [US4] Unit test for photo deletion logic in tests/unit/delete-service.test.js (deletePhoto, error handling)
- [X] T108 [P] [US4] Unit test for album deletion logic in tests/unit/delete-service.test.js (deleteAlbum, cascade behavior)
- [X] T109 [US4] Integration test for photo deletion workflow in tests/integration/photo-deletion.test.js (click delete → confirm → verify removed)
- [X] T110 [US4] Integration test for album deletion workflow in tests/integration/photo-deletion.test.js (click delete → confirm → verify removed + photos gone)
- [X] T111 [US4] Integration test for deletion cancellation in tests/integration/photo-deletion.test.js (click delete → cancel → verify still exists)
- [X] T112 [US4] Integration test for empty album auto-deletion in tests/integration/photo-deletion.test.js (delete last photo → verify album removed)
- [X] T113 [US4] Verify test coverage ≥80% for US4 files (Principle II: TDD)

**Checkpoint**: All user stories should now be independently functional. Complete photo album organizer with view, reorganize, import, and delete capabilities.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

**Constitution Quality Gates**:

- Code quality review (Principle I)
- Final test coverage verification ≥80% (Principle II)
- UX consistency audit (Principle III)
- Performance validation (Principle IV)

- [X] T114 [P] Add loading states for all async operations (spinner, skeleton screens)
- [X] T115 [P] Implement error toast notifications for user-friendly error display (Principle III: UX Consistency)
- [X] T116 [P] Add keyboard shortcuts documentation in quickstart.md (Tab, Enter, Escape, Delete, Alt+Arrows)
- [X] T117 [P] Optimize thumbnail caching strategy (preload next page, LRU eviction)
- [X] T118 [P] Add database connection pooling for concurrent operations
- [X] T119 [P] Implement virtual scrolling for 100+ albums (performance optimization)
- [X] T120 Code review and refactoring pass (Principle I: Code Quality - consistent naming, DRY, SOLID)
- [X] T121 ESLint full codebase check with --max-warnings 0
- [X] T122 Prettier full codebase formatting
- [X] T123 Accessibility audit with axe-core or similar tool (WCAG 2.1 AA compliance, Principle III)
- [X] T124 Cross-browser testing (Chrome 90+, Firefox 88+, Safari 14+)
- [X] T125 Performance benchmarking across all user stories (verify all targets met, Principle IV)
- [X] T126 Final test coverage report - verify ≥80% across all modules (Principle II: TDD)
- [X] T127 Security review (input validation, SQL injection prevention, XSS prevention)
- [X] T128 Memory profiling for 1000+ photos (<200MB target, Principle IV)
- [X] T129 Create sample photo dataset for development testing
- [X] T130 Update README.md with project description, setup, and usage
- [X] T131 Validate quickstart.md instructions (fresh clone → running app)
- [X] T132 Create deployment documentation for Tauri build process

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - can start independently
- **User Story 2 (Phase 4)**: Depends on Foundational (Phase 2) - uses US1 components but independently testable
- **User Story 3 (Phase 5)**: Depends on Foundational (Phase 2) - creates albums/photos for US1 to display
- **User Story 4 (Phase 6)**: Depends on Foundational (Phase 2) - removes albums/photos created by US3
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories ✅
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Integrates with US1 album list but independently testable ✅
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Creates data for US1 to display but independently testable ✅
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Deletes data created by US3 but independently testable ✅

### Within Each User Story

- Implementation tasks before tests (for contract tests that need actual implementation)
- Core services before UI components
- Database operations before file operations
- UI rendering before interaction handlers
- Performance validation after core functionality

### Parallel Opportunities

**Setup Phase (Phase 1)**:

- T003, T004, T005, T006, T007, T008, T010 can all run in parallel (different config files)

**Foundational Phase (Phase 2)**:

- T014, T015, T016, T017, T018 can all run in parallel (different lib/ files)

**User Story 1 (Phase 3)**:

- T025, T026, T027 can run in parallel (different service methods)
- T037, T038, T039, T040, T041, T042 can run in parallel (different test files)

**User Story 2 (Phase 4)**:

- T046, T047 can run in parallel (different service methods)
- T057, T058, T059 can run in parallel (different test files)

**User Story 3 (Phase 5)**:

- T064, T065, T066 can run in parallel (different service methods)
- T078-T086 can run in parallel (different test files)

**User Story 4 (Phase 6)**:

- T091, T092, T093, T094 can run in parallel (different service files/methods)
- T104-T108 can run in parallel (different test files)

**Polish Phase (Phase 7)**:

- T114, T115, T116, T117, T118, T119 can run in parallel (different features)

**Cross-Story Parallelization**:

- Once Foundational phase completes, all 4 user stories can be worked on in parallel by different team members
- Each story is independently testable and deliverable

---

## Parallel Example: User Story 1

```bash
# Services layer (parallel):
Task T025: "Implement AlbumService.getAllAlbums() in src/services/album-service.js"
Task T026: "Implement AlbumService.getAlbumById() in src/services/album-service.js"
Task T027: "Implement PhotoService.getPhotosInAlbum() in src/services/photo-service.js"

# Contract tests (parallel after services complete):
Task T037: "Contract test for Album table queries in tests/contract/database.test.js"
Task T038: "Contract test for Photo table queries in tests/contract/database.test.js"
Task T039: "Contract test for AlbumList component in tests/contract/ui-components.test.js"
Task T040: "Contract test for PhotoGrid component in tests/contract/ui-components.test.js"

# Unit tests (parallel):
Task T041: "Unit test for AlbumService in tests/unit/album-service.test.js"
Task T042: "Unit test for PhotoService in tests/unit/photo-service.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T011) - ~1-2 days
2. Complete Phase 2: Foundational (T012-T024) - ~3-5 days - CRITICAL BLOCKER
3. Complete Phase 3: User Story 1 (T025-T045) - ~3-5 days
4. **STOP and VALIDATE**: Test US1 independently with sample data
5. Deploy/demo MVP (browse albums and photos) - ~1 week total

### Incremental Delivery (Recommended)

1. Foundation (Phase 1 + 2) → ~5-7 days
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!) - ~1.5 weeks total
3. Add User Story 2 → Test independently → Deploy/Demo (browsing + reorganizing) - ~2 weeks total
4. Add User Story 3 → Test independently → Deploy/Demo (full photo management) - ~3 weeks total
5. Add User Story 4 → Test independently → Deploy/Demo (complete application) - ~3.5 weeks total
6. Polish (Phase 7) → Final release - ~4 weeks total

Each story adds value without breaking previous stories.

### Parallel Team Strategy (3-4 developers)

**Week 1**: All team members together

- Complete Setup (Phase 1)
- Complete Foundational (Phase 2)

**Week 2+**: Split into parallel tracks

- **Developer A**: User Story 1 (T025-T045)
- **Developer B**: User Story 2 (T046-T063)
- **Developer C**: User Story 3 (T064-T090)
- **Developer D**: User Story 4 (T091-T113)

**Week 4**: Regroup

- Integration testing across all stories
- Polish (Phase 7)
- Final validation

**Total**: ~4 weeks with 4 developers vs 6-8 weeks solo

---

## Task Summary

**Total Tasks**: 132 tasks

- Phase 1 (Setup): 11 tasks
- Phase 2 (Foundational): 13 tasks
- Phase 3 (User Story 1): 21 tasks
- Phase 4 (User Story 2): 18 tasks
- Phase 5 (User Story 3): 27 tasks
- Phase 6 (User Story 4): 23 tasks
- Phase 7 (Polish): 19 tasks

**Parallelizable Tasks**: 58 tasks marked [P]

**Test Tasks**: 48 tasks (contract, unit, integration)

- Contract tests: 20 tasks
- Unit tests: 15 tasks
- Integration tests: 13 tasks

**User Story Breakdown**:

- US1 (View/Browse): 21 tasks
- US2 (Drag-Drop): 18 tasks
- US3 (Import): 27 tasks
- US4 (Delete): 23 tasks

**Constitution Compliance**:

- Code Quality (Principle I): ESLint, Prettier, code review pass
- TDD (Principle II): 48 test tasks, ≥80% coverage verification
- UX Consistency (Principle III): WCAG 2.1 AA, error messages, accessibility audit
- Performance (Principle IV): Benchmarks for all targets (<1.5s albums, <2s photos, 60fps drag, ≥5 photos/sec import)

---

## Notes

- [P] tasks = different files, no cross-dependencies, can run in parallel
- [Story] label maps task to specific user story for independent tracking
- Each user story is independently completable and testable
- Follow TDD: Write tests, ensure they fail, implement, ensure they pass
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Foundational phase is CRITICAL - nothing can proceed without it
- MVP = Phase 1 + Phase 2 + Phase 3 (browsing only, ~1.5 weeks)
- Full application = All phases (~4 weeks solo, ~4 weeks with 4 developers)
