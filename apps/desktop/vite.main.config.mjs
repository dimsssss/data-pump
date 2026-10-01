import { defineConfig } from 'vite';
import path from "node:path";

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@packages/utils': path.resolve(__dirname, '../../packages/utils'),
    },
  }
});
