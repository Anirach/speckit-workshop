# Deployment Guide: Tauri Desktop Build

**Project**: Photo Album Organizer
**Platform**: Desktop (macOS, Windows, Linux)
**Framework**: Tauri 2.x

---

## Prerequisites

### System Requirements

**macOS**:
- macOS 10.15+ (Catalina or later)
- Xcode Command Line Tools: `xcode-select --install`
- Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

**Windows**:
- Windows 10 Build 19041+ (20H1 or later)
- Microsoft Visual Studio C++ Build Tools
- Rust: Download from https://rustup.rs/

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev \
  build-essential \
  curl \
  wget \
  libssl-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Development Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Tauri CLI
npm install -D @tauri-apps/cli
```

---

## Project Setup for Tauri

### 1. Initialize Tauri

```bash
npm install -D @tauri-apps/cli
npx tauri init
```

**Configuration Prompts**:
- App name: `Photo Album Organizer`
- Window title: `Photo Album Organizer`
- Web assets: `dist`
- Dev server URL: `http://localhost:5173`
- Frontend dev command: `npm run dev`
- Frontend build command: `npm run build`

### 2. Tauri Configuration (`src-tauri/tauri.conf.json`)

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "Photo Album Organizer",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "fs": {
        "all": true,
        "readFile": true,
        "writeFile": true,
        "createDir": true,
        "removeFile": true,
        "scope": ["$APPDATA/photo-album-organizer/*"]
      },
      "dialog": {
        "all": true,
        "open": true
      },
      "path": {
        "all": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Productivity",
      "copyright": "Copyright © 2025",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.photoalbum.organizer",
      "longDescription": "Desktop photo organizer with automatic album creation, drag-and-drop reordering, and smart duplicate detection.",
      "macOS": {
        "entitlements": null,
        "exceptionDomain": "",
        "frameworks": [],
        "providerShortName": null,
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "Organize your photos effortlessly",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampUrl": ""
      }
    },
    "security": {
      "csp": "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'"
    },
    "updater": {
      "active": false
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 800,
        "resizable": true,
        "title": "Photo Album Organizer",
        "width": 1200,
        "minWidth": 800,
        "minHeight": 600
      }
    ]
  }
}
```

### 3. Update Database Path for Tauri

**Modify `src/lib/database.js`**:
```javascript
import { appDataDir } from '@tauri-apps/api/path'

let dbPath

async function initDatabasePath() {
  const dataDir = await appDataDir()
  dbPath = `${dataDir}/photo-album.db`
}

export async function getDatabase() {
  if (!dbPath) {
    await initDatabasePath()
  }
  // ... rest of database code
}
```

### 4. Update File System for Tauri

**Modify `src/lib/file-system.js`**:
```javascript
import { appDataDir } from '@tauri-apps/api/path'
import { writeFile, readFile, createDir } from '@tauri-apps/api/fs'

async function getStoragePaths() {
  const dataDir = await appDataDir()
  return {
    photos: `${dataDir}/storage/photos`,
    thumbnails: `${dataDir}/storage/thumbnails`
  }
}
```

---

## Build Process

### Development Build

```bash
npm run tauri dev
```

This will:
1. Start Vite dev server (`npm run dev`)
2. Launch Tauri window with hot-reload

### Production Build

```bash
npm run tauri build
```

**Build Output Locations**:

**macOS**:
- DMG: `src-tauri/target/release/bundle/dmg/Photo Album Organizer_0.1.0_x64.dmg`
- App: `src-tauri/target/release/bundle/macos/Photo Album Organizer.app`

**Windows**:
- MSI: `src-tauri\target\release\bundle\msi\Photo Album Organizer_0.1.0_x64_en-US.msi`
- EXE: `src-tauri\target\release\Photo Album Organizer.exe`

**Linux**:
- DEB: `src-tauri/target/release/bundle/deb/photo-album-organizer_0.1.0_amd64.deb`
- AppImage: `src-tauri/target/release/bundle/appimage/photo-album-organizer_0.1.0_amd64.AppImage`

---

## Code Signing

### macOS (Apple Developer Account Required)

```bash
export APPLE_CERTIFICATE="Developer ID Application: Your Name (TEAM_ID)"
export APPLE_ID="you@example.com"
export APPLE_PASSWORD="app-specific-password"
export APPLE_TEAM_ID="TEAM_ID"

npm run tauri build -- --target universal-apple-darwin
```

**Generate App-Specific Password**:
1. Go to https://appleid.apple.com
2. Sign in → Security → App-Specific Passwords
3. Generate new password
4. Use in `APPLE_PASSWORD` env var

### Windows (Code Signing Certificate Required)

```powershell
$env:WINDOWS_CERTIFICATE="path\to\certificate.pfx"
$env:WINDOWS_CERTIFICATE_PASSWORD="certificate-password"

npm run tauri build
```

**Get Code Signing Certificate**:
- Purchase from DigiCert, Sectigo, or similar CA
- Convert to PFX format
- Set environment variables before build

---

## Distribution

### macOS

**Option 1: Direct Download (DMG)**
```bash
# Upload to your website
scp "src-tauri/target/release/bundle/dmg/*.dmg" user@server:/var/www/downloads/
```

**Option 2: Mac App Store** (requires Apple Developer Program)
1. Enroll in Apple Developer Program ($99/year)
2. Create App ID in App Store Connect
3. Configure entitlements for App Sandbox
4. Submit via Xcode or Transporter app

### Windows

**Option 1: Direct Download (MSI)**
```bash
# Upload installer
scp "src-tauri/target/release/bundle/msi/*.msi" user@server:/var/www/downloads/
```

**Option 2: Microsoft Store**
1. Create Partner Center account
2. Reserve app name
3. Package with Desktop Bridge
4. Submit for certification

### Linux

**Option 1: Direct Download**
```bash
# DEB package
scp "src-tauri/target/release/bundle/deb/*.deb" user@server:/var/www/downloads/

# AppImage (universal)
scp "src-tauri/target/release/bundle/appimage/*.AppImage" user@server:/var/www/downloads/
```

**Option 2: Snap Store**
```bash
snapcraft
snapcraft upload photo-album-organizer_0.1.0_amd64.snap
```

**Option 3: Flathub**
1. Create Flatpak manifest (`com.photoalbum.organizer.yaml`)
2. Submit to https://github.com/flathub/flathub

---

## Auto-Updates

### Enable Tauri Updater

**Update `tauri.conf.json`**:
```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://releases.yourapp.com/{{target}}/{{current_version}}"
      ],
      "dialog": true,
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

### Generate Update Keys

```bash
npx tauri signer generate -w ~/.tauri/myapp.key
```

Output:
- Private key: `~/.tauri/myapp.key` (keep secret!)
- Public key: Copy to `tauri.conf.json`

### Create Update Server

**Directory Structure**:
```
releases.yourapp.com/
├── darwin-x86_64/
│   ├── 0.1.0/
│   │   ├── Photo Album Organizer.app.tar.gz
│   │   └── Photo Album Organizer.app.tar.gz.sig
├── windows-x86_64/
│   ├── 0.1.0/
│   │   ├── Photo Album Organizer.msi
│   │   └── Photo Album Organizer.msi.sig
└── linux-x86_64/
    ├── 0.1.0/
    │   ├── photo-album-organizer.AppImage
    │   └── photo-album-organizer.AppImage.sig
```

**Sign Releases**:
```bash
npx tauri signer sign "Photo Album Organizer.app.tar.gz" -k ~/.tauri/myapp.key
```

---

## CI/CD Pipeline

### GitHub Actions (`.github/workflows/build.yml`)

```yaml
name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install dependencies (Ubuntu)
        if: matrix.os == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev

      - name: Install npm dependencies
        run: npm ci

      - name: Build Tauri app
        run: npm run tauri build

      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: src-tauri/target/release/bundle/
```

---

## Testing

### Before Release Checklist

- [ ] Test on target platform (macOS / Windows / Linux)
- [ ] Verify database migrations work
- [ ] Test file import with various EXIF data
- [ ] Test drag-and-drop reordering
- [ ] Test deletion with confirmation
- [ ] Check memory usage (<200MB for 1000 photos)
- [ ] Verify app icon displays correctly
- [ ] Test updates (if updater enabled)
- [ ] Review security (SECURITY.md)
- [ ] Run accessibility audit (ACCESSIBILITY.md)

---

## Troubleshooting

### Build Errors

**Error**: `error: failed to run custom build command for 'sqlite3-sys'`
**Solution**: Install SQLite development headers
```bash
# macOS
brew install sqlite

# Ubuntu
sudo apt install libsqlite3-dev

# Windows
# SQLite is bundled with better-sqlite3
```

**Error**: `webkit2gtk not found`
**Solution**: Install WebKit dependencies (Linux only)
```bash
sudo apt install libwebkit2gtk-4.0-dev
```

### Runtime Errors

**Error**: `Database file not found`
**Solution**: Ensure app data directory is created
```javascript
import { appDataDir } from '@tauri-apps/api/path'
import { createDir } from '@tauri-apps/api/fs'

await createDir(await appDataDir(), { recursive: true })
```

**Error**: `Permission denied reading file`
**Solution**: Update `tauri.conf.json` file system scope
```json
{
  "tauri": {
    "allowlist": {
      "fs": {
        "scope": ["$APPDATA/**", "$HOME/Pictures/**"]
      }
    }
  }
}
```

---

## Resources

- Tauri Documentation: https://tauri.app
- Tauri Discord: https://discord.com/invite/tauri
- Rust Toolchain: https://rustup.rs
- Code Signing Guide: https://tauri.app/v1/guides/distribution/sign-macos

---

## Next Steps

1. **Set up Tauri project**: `npm install -D @tauri-apps/cli && npx tauri init`
2. **Update file paths**: Modify database.js and file-system.js to use `appDataDir()`
3. **Test build**: `npm run tauri dev`
4. **Create release build**: `npm run tauri build`
5. **Sign binaries**: Follow code signing instructions above
6. **Distribute**: Upload to website or submit to app stores

---

**Note**: This guide assumes a basic Tauri 2.x setup. Adjust configuration based on specific project requirements.
