import { defineConfig } from 'tsdown'

export default defineConfig(['main', 'bin/cli'].map((entry) => ({
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
})))
