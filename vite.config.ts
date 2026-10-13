import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const PAGES_BASE_PATH = '/ArcadeRoom/';

export default defineConfig(({ command, isPreview }) => {
  const isBuild = command === 'build';
  const isBuiltSite = isBuild || isPreview === true;
  const base = isBuiltSite ? PAGES_BASE_PATH : '/';
  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      strictPort: true,
    },
    test: {
      environment: 'node',
    },
  };
});
