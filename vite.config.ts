// vite config
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/zoomtoken': 'http://localhost:3001'
    }
  }
})