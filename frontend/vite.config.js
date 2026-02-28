import { defineConfig } from 'vite';
import { glob } from 'glob';
import path from 'path';

const input = Object.fromEntries(
  glob.sync('*.html').map(file => [
    path.parse(file).name,
    path.resolve(__dirname, file)
  ])
);

export default defineConfig({
  build: {
    rollupOptions: {
      input,
    },
    outDir: 'public',
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
});
