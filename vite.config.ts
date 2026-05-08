import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/india-aqi-dashboard/',
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
