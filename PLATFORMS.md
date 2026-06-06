# Multi-Platform Distribution Guide

This repository is built as a highly modular full-stack application that compiles seamlessly into three distinct native targets in addition to standard Web deployment:
1. **Progressive Web App (PWA)**
2. **Android App (via Capacitor)**
3. **Desktop macOS/Windows/Linux App (via Electron)**

---

## 📱 1. Progressive Web App (PWA)

The PWA configuration is automated using `vite-plugin-pwa` within `vite.config.ts`. It provides standalone launch capabilities, rich offline assets caching, and instant startup metrics.

### Key Features Installed:
* **Service Worker Auto-Update**: Activated through `registerType: 'autoUpdate'`.
* **Resource Caching**: Configured via workbox rules inside `vite.config.ts` covering JavaScript styles, static HTML, icons, and SVG images.
* **Manifest Manifestations**: Auto-linked `public/manifest.json` ensuring beautiful desktop & mobile screen installation.

### Developer Commands:
```bash
# Build the production PWA version
npm run pwa:build

# Preview the built PWA to test offline caching or installation checks
npx vite preview
```

---

## 🤖 2. Capacitor (Android Native App)

Capacitor wraps the compiled web bundle inside a fully-featured Native WebView and links device APIs cleanly via plugins.

### Setup and Synchronizing:
1. Compile the web code:
   ```bash
   npm run build
   ```
2. Synchronize configuration assets with the native Android project:
   ```bash
   npm run cap:sync
   ```
3. Open the Android project in Android Studio to build the debugging APK or bundle release:
   ```bash
   npm run cap:open
   ```

### Quick Build Command:
```bash
npm run cap:build
```

---

## 💻 3. Electron (macOS/Windows/Linux Desktop)

Electron runs the app within an optimized Chromium environment alongside native Node.js processes, featuring customized macOS titlebar styles (`hiddenInset`).

### Setup and Integration files:
* **Main Entry Process**: `/electron/main.cjs` - configures windows styles, desktop dimensions, development environment loading, and production resource loader.
* **Preload Script**: `/electron/preload.cjs` - establishes secure Context Isolation boundary to bridge renderer tasks (Vite/React) with native APIs.

### Developer Commands:
```bash
# Start Vite development server and Electron simultaneously in watcher mode (with Wait-On verification)
npm run electron:dev

# Start Electron pointing to the active dev container
npm run electron:start
```

### Packaging & Bundling for Distribution:
To distribute and package your Electron desktop app into native macOS dmg/zip, Windows exe, or Linux AppImage, you can add or use built-in packaging tools:
```bash
# Install electron-builder as dev dependency (if not loaded)
npm install -D electron-builder

# Run Electron Builder packaging script
npx electron-builder
```

---

## 🛠️ Diagnostics & Platform Detection

At runtime, the app detects the environment using the `@/utils/platform.ts` utility. The active target is dynamically updated and shown in **Settings > About > Platform**.
