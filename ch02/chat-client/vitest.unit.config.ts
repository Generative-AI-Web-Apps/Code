import { configDefaults, defineConfig, mergeConfig } from 'vitest/config';
import vitestConfig from './vitest.config.js';

export default mergeConfig(
  vitestConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      isolate: false,
      setupFiles: 'tests/setup.ts',
      css: false,
      exclude: [...configDefaults.exclude, '**/e2e/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
  }),
);
