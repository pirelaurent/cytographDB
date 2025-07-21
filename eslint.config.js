// installer le preseet : npm install @eslint/js --save-dev
// lancer : npx eslint . --ext .js 




// eslint.config.js
import js from '@eslint/js';

export default [
  {
    ...js.configs.recommended,
    ignores: [
      'public/js/external/**'
    ],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off'
    }
  }
];
