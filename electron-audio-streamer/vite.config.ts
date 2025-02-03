import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: './src/renderer',
  base: './',  // Ensure assets use relative paths
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
});
