const js = require('@eslint/js')
const globals = require('globals')

/** Flat config for linting this package (ESLint 9+). */
module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 11,
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  }
]
