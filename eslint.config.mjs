
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs as astroConfigs } from 'eslint-plugin-astro';
import { importX } from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import sonarjs from 'eslint-plugin-sonarjs';
import unusedImports from 'eslint-plugin-unused-imports';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default defineConfig(
    // ─────────────────────────────────────
    // IGNORE
    // ─────────────────────────────────────
    {
        ignores: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.astro/**',
            '**/.vercel/**',
            '**/.netlify/**',
            '**/.turbo/**',
            '**/generated/**',
            '**/*.min.js',
            // Prototype rangé pour référence, hors du projet (non versionné).
            'old/**',
            'captures/**',
        ],
    },

    // ─────────────────────────────────────
    // TYPESCRIPT STRICT
    // ─────────────────────────────────────
    {
        files: ['**/*.{ts,tsx}'],

        extends: [
            js.configs.recommended,
            tseslint.configs.strictTypeChecked,
            tseslint.configs.stylisticTypeChecked,
            importX.flatConfigs.recommended,
            importX.flatConfigs.typescript,
        ],

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',

            globals: {
                ...globals.browser,
                ...globals.node,
            },

            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },

        plugins: {
            'unused-imports': unusedImports,
            sonarjs,
        },

        rules: {
            // TYPESCRIPT
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/no-misused-promises': 'error',
            '@typescript-eslint/no-unnecessary-condition': 'error',
            '@typescript-eslint/no-unnecessary-type-assertion': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/switch-exhaustiveness-check': 'error',
            // Les messages (erreurs de build, scripts) citent des tailles et des numéros : un nombre dans un gabarit
            // est voulu. Restent refusés : objets, null, undefined, any.
            '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],

            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],

            // UNUSED
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',

            'unused-imports/no-unused-imports': 'error',

            'unused-imports/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // IMPORTS
            'import-x/first': 'error',
            'import-x/no-duplicates': 'error',
            'import-x/no-self-import': 'error',
            'import-x/no-cycle': 'error',
            // Modules virtuels d'Astro (astro:content, astro:assets…) : résolus par Vite, vérifiés par astro check.
            'import-x/no-unresolved': ['error', { ignore: ['^astro:'] }],

            'import-x/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        ['parent', 'sibling', 'index'],
                        'type',
                    ],
                    'newlines-between': 'always',
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],

            // JAVASCRIPT
            eqeqeq: ['error', 'always'],
            curly: ['error', 'all'],
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-template': 'error',
            'object-shorthand': 'error',
            'no-else-return': 'error',
            'no-debugger': 'error',
            'no-eval': 'error',

            'no-console': [
                'warn',
                {
                    allow: ['warn', 'error'],
                },
            ],

            // COMPLEXITÉ
            complexity: ['warn', 15],
            'max-depth': ['warn', 4],
            'max-params': ['warn', 4],

            'sonarjs/cognitive-complexity': ['warn', 15],
            'sonarjs/no-identical-expressions': 'error',
            'sonarjs/no-duplicated-branches': 'error',
        },
    },

    // ─────────────────────────────────────
    // JAVASCRIPT
    // ─────────────────────────────────────
    {
        files: ['**/*.{js,mjs,cjs}'],

        extends: [
            js.configs.recommended,
            importX.flatConfigs.recommended,
        ],

        languageOptions: {
            globals: globals.node,
        },

        rules: {
            eqeqeq: ['error', 'always'],
            'no-var': 'error',
            'prefer-const': 'error',
            'no-debugger': 'error',
            'import-x/no-duplicates': 'error',
        },
    },

    // ─────────────────────────────────────
    // ASTRO
    // ─────────────────────────────────────

    ...astroConfigs.recommended,
    ...astroConfigs['jsx-a11y-recommended'],

    {
        files: ['**/*.astro'],

        plugins: {
            'unused-imports': unusedImports,
            sonarjs,
        },

        rules: {
            // ASTRO
            'astro/no-conflict-set-directives': 'error',
            'astro/no-deprecated-astro-canonicalurl': 'error',
            'astro/no-unused-define-vars-in-style': 'error',

            // XSS : désactiver localement si HTML fiable et nettoyé
            'astro/no-set-html-directive': 'error',

            // UNUSED
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': 'off',

            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // QUALITÉ
            eqeqeq: ['error', 'always'],
            'no-debugger': 'error',
            'no-eval': 'error',
            'prefer-const': 'error',

            // Ne pas appliquer les règles nécessitant
            // les services TypeScript ici.
            'sonarjs/cognitive-complexity': ['warn', 15],
        },
    },

    // ─────────────────────────────────────
    // JSX / TSX ACCESSIBILITY
    // ─────────────────────────────────────
    {
        files: ['**/*.{jsx,tsx}'],

        extends: [jsxA11y.flatConfigs.recommended],

        languageOptions: {
            globals: globals.browser,
        },
    },

    // ─────────────────────────────────────
    // SCRIPTS (npm run palette, image, vercel, captures) : la console est leur sortie
    // ─────────────────────────────────────
    {
        files: ['scripts/**/*.ts'],

        rules: {
            'no-console': 'off',
        },
    },

    // ─────────────────────────────────────
    // TESTS
    // ─────────────────────────────────────
    {
        files: [
            '**/*.test.{ts,tsx}',
            '**/*.spec.{ts,tsx}',
            '**/__tests__/**/*.{ts,tsx}',
        ],

        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-non-null-assertion': 'off',
            'sonarjs/cognitive-complexity': 'off',
            'max-params': 'off',
        },
    },

    // ─────────────────────────────────────
    // PRETTIER (TOUJOURS EN DERNIER)
    // ─────────────────────────────────────
    prettier,
);

