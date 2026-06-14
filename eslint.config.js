import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import pluginN from 'eslint-plugin-n'
import pluginSecurity from 'eslint-plugin-security'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    '__tests__/**/*.ts',
    'dist/**',
    'coverage/**',
    'node_modules/**',
    'apm_modules/**',
    '.cursor/**',
    '.devcontainer/**',
    '.github/**',
    '.vscode/**',
    '.gemini/**',
    '.claude/**',
    '.agents/**'
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  pluginN.configs['flat/recommended-script'],
  pluginSecurity.configs.recommended,
  {
    rules: {
      'n/no-process-exit': 'off',
      'n/no-unsupported-features': 'off',
      'n/no-unpublished-require': 'off',
      'security/detect-non-literal-fs-filename': 'off',
      'security/detect-unsafe-regex': 'error',
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-regexp': 'error',
      'security/detect-object-injection': 'off',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'space-before-function-paren': 'off',
      'object-curly-spacing': 'off',
      'no-control-regex': 'off',
      'n/hashbang': 'off',
      'n/no-unsupported-features/node-builtins': 'warn'
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module'
    }
  }
])
