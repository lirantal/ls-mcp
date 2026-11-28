import { defineConfig } from 'vite-plus'
import type { PackUserConfig } from 'vite-plus/pack'

export default defineConfig({
  pack: ['main', 'bin/cli'].map((entry): PackUserConfig => ({
    entry: { [entry]: `src/${entry}.ts` },
    format: ['esm', 'cjs'],
    dts: { sourcemap: false },
    platform: 'node',
    target: 'es2022',
    treeshake: false,
    outExtensions: ({ format }) => ({
      js: format === 'cjs' ? '.cjs' : '.mjs',
      dts: format === 'cjs' ? '.d.cts' : '.d.ts'
    }),
    outputOptions: (options, format, { cjsDts }) => ({
      ...options,
      codeSplitting: false,
      // Vitest remaps coverage from the CommonJS CLI integration tests.
      sourcemap: entry === 'bin/cli' && format === 'cjs' && !cjsDts
    })
  })),
  staged: {
    '{src/**/*,vite.config,vitest.config}.{js,cjs,mjs,ts,cts,mts}': 'npm run lint:fix --'
  }
})
