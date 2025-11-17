import { defineConfig } from 'vite'

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['better-sqlite3', 'exifreader']
        }
      }
    }
  },
  server: {
    port: 3000,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    exclude: ['better-sqlite3']
  }
})
