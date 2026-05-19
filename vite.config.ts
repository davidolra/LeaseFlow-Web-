// --- DENTRO DE vite.config.ts ---

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'path'; 

export default defineConfig({
  plugins: [react()],


  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Mapea @/ a la carpeta src
    },
  },
 
  
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },

  server: {
    proxy: {
      '/userservice/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/userservice/, ''),
      },
      '/propertyservice/api': {
        target: 'http://localhost:8082',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/propertyservice/, ''),
      },
      '/documentservice/api': {
        target: 'http://localhost:8083',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/documentservice/, ''),
      },
      '/applicationservice/api': {
        target: 'http://localhost:8084',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/applicationservice/, ''),
      },
      '/contactservice/api': {
        target: 'http://localhost:8085',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/contactservice/, ''),
      },
      '/reviewservice/api': {
        target: 'http://localhost:8086',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/reviewservice/, ''),
      },
    },
  },
});
