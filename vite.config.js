import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    hmr: {
      overlay: false,
      timeout: 60000,
    },
    proxy: {
      '/api/search': {
        target: 'http://localhost:8091',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    globals: true,
  },
  // Using Vite 6.x to avoid crypto.hash error on Node < 20.12.0
  // If you upgrade Node to 20.12.0+, you can upgrade back to Vite 7.x
})
