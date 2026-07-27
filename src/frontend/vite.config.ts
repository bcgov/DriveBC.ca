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
    sourcemap: false,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
//    proxy: {
//      '/images': 'https://dev.drivebc.ca',
//      '/api': 'https://dev.drivebc.ca',
//    },
  },
});
