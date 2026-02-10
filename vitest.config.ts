import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    globals: true,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary'],
      include: [
        'src/lib/**/*.ts',
        'src/hooks/**/*.ts',
        'src/contexts/**/*.tsx',
        'src/components/**/*.tsx',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        'src/lib/database.types.ts',
        'src/lib/gotv/types.ts',
        'src/**/*.test.{ts,tsx}',
        'src/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
