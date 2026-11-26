import { defineConfig } from 'vite-plus'

export default defineConfig({
  staged: {
    '{src/**/*,tsdown.config,vite.config,vitest.config}.{js,cjs,mjs,ts,cts,mts}': 'npm run lint:fix --'
  }
})
