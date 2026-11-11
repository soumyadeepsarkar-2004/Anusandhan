import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-electron/**',
      '.vercel/**',
      'node_modules/**',
      'server/node_modules/**',
      'backend/**',
      'android/**',
      'docs/.vitepress/**',
      'public/**',
      'scratch/**',
      '.agents/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Pragmatic gates: catch real bugs, don't block on style (no formatter in this repo).
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': 'off',
      eqeqeq: ['error', 'smart'],
      'no-undef': 'off', // TypeScript already checks this
    },
  },
  {
    files: ['**/*.{js,cjs,mjs}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.cjs'],
    rules: {
      // .cjs files are CommonJS by design — require() is the correct import syntax
      '@typescript-eslint/no-require-imports': 'off',
    },
  }
);
