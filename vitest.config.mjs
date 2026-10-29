import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const testEnv = {};
if (fs.existsSync('.env.test')) {
  const content = fs.readFileSync('.env.test', 'utf-8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      testEnv[match[1]] = (match[2] || '').replace(/^['"]|['"]$/g, '');
    }
  });
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'next-auth/react': path.resolve('apps/web/node_modules/next-auth/react'),
      'next-auth': path.resolve('apps/web/node_modules/next-auth'),
      '@': path.resolve('apps/web'),
    },
  },
  test: {
    globals: true,
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/e2e/**'],
    env: testEnv
  },
});
