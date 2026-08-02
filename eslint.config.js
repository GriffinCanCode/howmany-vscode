const js = require('@eslint/js');
const globals = require('globals');
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
    { ignores: ['dist/**', 'node_modules/**', '.vscode-test/**', '**/*.d.ts'] },
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tseslint.parser,
            ecmaVersion: 2020,
            sourceType: 'module',
            globals: {
                ...globals.node,
                ...globals.mocha,
                // @types/vscode declares Thenable globally; the extension API
                // returns it in place of a Promise.
                Thenable: 'readonly',
            },
        },
        plugins: { '@typescript-eslint': tseslint.plugin },
        rules: {
            semi: 'warn',
            curly: 'off',
            eqeqeq: 'warn',
            'no-throw-literal': 'warn',
            'no-unused-vars': 'off',
            'no-console': 'off',
            'no-case-declarations': 'off',
        },
    }
);
