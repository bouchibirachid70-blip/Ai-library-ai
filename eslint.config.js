import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', 'api']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Data-fetching components commonly set state inside effects; the
      // strict rule produces false positives in this codebase.
      'react-hooks/set-state-in-effect': 'off',
      // We dynamically resolve Lucide icon components by name from data; this
      // pattern is intentional and the strict static-component rule produces
      // false positives for it.
      'react-hooks/static-components': 'off',
      // Allow hooks/utils to coexist with components in the same file.
      'react-refresh/only-export-components': 'off',
      // TypeScript already covers these.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
]);
