import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [
    react(),
  ],
  worker: {
    format: 'es',
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['abs-percent', 'color-functions', 'import', 'global-builtin'],
        quietDeps: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/images': 'https://dev.drivebc.ca',
      '/api': 'https://dev.drivebc.ca',
    },
  },
});