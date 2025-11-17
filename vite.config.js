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
          vendor: ['exifreader']
        }
      }
    }
  },
  server: {
    port: 3450,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    include: ['exifreader']
  }
})
