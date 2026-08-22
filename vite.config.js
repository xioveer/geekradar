import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true
  }
})
