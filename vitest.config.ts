import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['__tests__/**/*.test.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      autoAttachSubprocess: true,
      include: ['src/**', 'dist/bin/cli.cjs'],
      excludeAfterRemap: true,
      reporter: ['text', 'lcov', 'html']
    }
  }
})
