import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier';

/**
 * Flat config, composed directly.
 *
 * eslint-config-next 16 ships native flat configs, so they are spread in as
 * arrays. Wrapping them in FlatCompat — the pattern from the ESLint 8 era —
 * crashes with "Converting circular structure to JSON", because the compat
 * layer tries to serialise a config that already contains resolved plugin
 * objects.
 */
const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'next-env.d.ts', 'lighthouse/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      // `any` is banned outright. Where a third-party type is genuinely
      // unknowable, use `unknown` and narrow, and leave a comment saying why.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
    },
  },
  {
    // Node-side scripts legitimately log to stdout.
    files: ['scripts/**/*.ts', 'src/lib/db/**/*.ts'],
    rules: { 'no-console': 'off' },
  },
];

export default config;
