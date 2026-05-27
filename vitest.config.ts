import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@cosmoslock/core': path.resolve(__dirname, 'packages/cosmoslock-core/src'),
      '@cosmoslock/vault': path.resolve(__dirname, 'packages/cosmoslock-vault/src'),
      '@cosmoslock/server': path.resolve(__dirname, 'packages/cosmoslock-server/src')
    }
  },
  test: { include: ['tests/**/*.test.ts'] }
});
