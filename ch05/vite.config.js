import { defineConfig } from 'vite'
import { configDefaults } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // or 'jsdom' if browser-like env is needed
    exclude: [...configDefaults.exclude, 'node_modules'],
  }
})