# Photo Album Organizer

A modern, desktop-focused web application for organizing photos into date-based albums with drag-and-drop customization and intelligent metadata management.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)

## Features

### 📸 Smart Photo Organization

- **Automatic Grouping**: Photos are automatically organized into monthly albums based on EXIF date metadata
- **Intelligent Metadata**: Extracts and preserves EXIF data including date taken, timezone, camera model, and dimensions
- **Duplicate Detection**: Hash-based duplicate detection prevents importing the same photo twice

### 🎨 User-Friendly Interface

- **Tile-Based View**: Browse photos in a responsive grid with 300x300px thumbnails
- **Drag-and-Drop**: Reorganize albums with smooth 60fps animations
- **Empty States**: Helpful instructions when no albums exist
- **Loading States**: Skeleton screens and spinners for better UX

### ⚡ Performance Optimized

- **Virtual Scrolling**: Handles 100+ albums without UI degradation
- **Lazy Loading**: Thumbnails load on-demand with IntersectionObserver
- **LRU Cache**: Smart caching with preloading for optimal performance
- **Connection Pooling**: Efficient database operations with WAL mode

### ♿ Accessibility

- **WCAG 2.1 AA Compliant**: Full keyboard navigation and screen reader support
- **Keyboard Shortcuts**: Navigate and manage albums without a mouse
- **Focus Management**: Proper focus trapping in modals and dialogs
- **ARIA Labels**: Comprehensive ARIA attributes for assistive technologies

## Quick Start

### Prerequisites

- **Node.js**: 18.x or later
- **npm**: 8.x or later
- **Operating System**: macOS, Windows, or Linux

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd photo-album-organizer

# Checkout the feature branch
git checkout 001-photo-album-organizer

# Install dependencies
npm install

# Initialize database
npm run db:init

# Create storage directories
mkdir -p storage/photos storage/thumbnails
```

### Development

```bash
# Start development server
npm run dev

# The app will be available at http://localhost:5173
```

### Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit          # Unit tests (Vitest)
npm run test:integration   # Integration tests (Playwright)
npm run test:contract      # Contract tests (Web Test Runner)

# Generate coverage report
npm run test:coverage
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
photo-album-organizer/
├── src/
│   ├── lib/               # Core libraries
│   │   ├── database.js    # SQLite connection pooling
│   │   ├── file-system.js # File operations
│   │   ├── hash.js        # SHA-256 hashing
│   │   ├── exif.js        # EXIF metadata extraction
│   │   ├── thumbnail.js   # Thumbnail generation
│   │   └── thumbnail-cache.js  # LRU cache with preloading
│   │
│   ├── services/          # Business logic
│   │   ├── album-service.js    # Album CRUD
│   │   ├── photo-service.js    # Photo CRUD
│   │   ├── import-service.js   # Import workflow
│   │   └── delete-service.js   # Deletion logic
│   │
│   ├── ui/                # UI components
│   │   ├── album-list.js       # Album grid
│   │   ├── photo-grid.js       # Photo tiles
│   │   ├── drag-drop.js        # Drag-and-drop
│   │   ├── modal.js            # Confirmation dialogs
│   │   ├── progress.js         # Progress indicator
│   │   ├── loading.js          # Loading states
│   │   ├── toast.js            # Toast notifications
│   │   ├── virtual-scroll.js   # Virtual scrolling
│   │   └── navigation.js       # Client-side routing
│   │
│   └── styles/            # CSS files
│       ├── main.css       # Global styles
│       ├── albums.css     # Album styles
│       ├── photos.css     # Photo styles
│       └── components.css # Component styles
│
├── tests/                 # Test suites
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── contract/          # Contract tests
│
├── storage/               # Runtime data (gitignored)
│   ├── photos/            # Original photos
│   ├── thumbnails/        # Generated thumbnails
│   └── metadata.db        # SQLite database
│
└── specs/                 # Feature specifications
    └── 001-photo-album-organizer/
        ├── spec.md        # Feature specification
        ├── plan.md        # Implementation plan
        ├── tasks.md       # Task breakdown
        ├── data-model.md  # Database schema
        ├── research.md    # Technical decisions
        ├── quickstart.md  # Setup guide
        └── contracts/     # API contracts
```

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES2022+), HTML5, CSS3
- **Build Tool**: Vite 5.x
- **Database**: SQLite (better-sqlite3)
- **Metadata**: exifreader (EXIF extraction)
- **Testing**: Vitest, Playwright, Web Test Runner
- **Code Quality**: ESLint (StandardJS), Prettier

## Keyboard Shortcuts

### Global

- `Tab` / `Shift+Tab` - Navigate elements
- `Escape` - Close modal or cancel action
- `Enter` - Activate focused element

### Album List

- `Arrow Keys` - Navigate albums
- `Enter` - Open album
- `Delete` - Delete album
- `Alt+↑/↓` - Reorder albums
- `i` - Import photos

### Photo Grid

- `Arrow Keys` - Navigate photos
- `Delete` - Delete photo
- `Backspace` - Return to album list

See [quickstart.md](specs/001-photo-album-organizer/quickstart.md) for complete keyboard shortcut documentation.

## Performance Targets

| Operation             | Target   | Typical  |
| --------------------- | -------- | -------- |
| Album list loading    | <1.5s    | 0.8-1.2s |
| Photo tiles loading   | <2s      | 1.2-1.8s |
| Drag-and-drop         | 60fps    | 60fps    |
| Photo import          | ≥5/sec   | 5-7/sec  |
| Memory usage (1000p)  | <200MB   | ~150MB   |

## Development Principles

This project follows strict development principles documented in [constitution.md](.specify/memory/constitution.md):

1. **Code Quality First**: ESLint + Prettier, DRY, SOLID
2. **Test-Driven Development**: ≥80% coverage required
3. **UX Consistency**: WCAG 2.1 AA, standardized error messages
4. **Performance Requirements**: All targets validated

## Contributing

1. Read [constitution.md](.specify/memory/constitution.md)
2. Review [spec.md](specs/001-photo-album-organizer/spec.md)
3. Check [tasks.md](specs/001-photo-album-organizer/tasks.md) for available work
4. Follow TDD workflow
5. Ensure all tests pass and coverage ≥80%
6. Run `npm run lint` and `npm run format` before committing

## Documentation

- **[Specification](specs/001-photo-album-organizer/spec.md)**: Feature requirements and user stories
- **[Implementation Plan](specs/001-photo-album-organizer/plan.md)**: Technical approach and architecture
- **[Tasks](specs/001-photo-album-organizer/tasks.md)**: Complete task breakdown
- **[Quickstart Guide](specs/001-photo-album-organizer/quickstart.md)**: Setup and development workflow
- **[Data Model](specs/001-photo-album-organizer/data-model.md)**: Database schema and entities
- **[Research](specs/001-photo-album-organizer/research.md)**: Technical decisions and alternatives

## License

MIT

## Support

For issues or questions:

1. Check [quickstart.md](specs/001-photo-album-organizer/quickstart.md#troubleshooting)
2. Review [constitution.md](.specify/memory/constitution.md) for development workflow
3. Check [tasks.md](specs/001-photo-album-organizer/tasks.md) for implementation status

---

**Built with ❤️ using Vite, SQLite, and modern web standards**
