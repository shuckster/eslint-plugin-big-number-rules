/**
 * Minimal lint run used by upgrade-contracts to snapshot ESLint deprecations.
 * Run under the current process so process listeners catch warnings.
 */

const RuleTester = require('eslint').RuleTester
const arithmetic = require('../../lib/rules/arithmetic')

const warnings = new Set()

process.on('warning', w => {
  if (w.name === 'DeprecationWarning' && /ESLint|rule is using/.test(w.message)) {
    // Normalize: drop rule name quoting differences, keep API guidance
    const normalized = w.message
      .replace(/^"[^"]+" rule is using /, 'rule is using ')
      .replace(/\s+/g, ' ')
      .trim()
    warnings.add(normalized)
  }
})

const tester = new RuleTester({
  parserOptions: { ecmaVersion: 11, sourceType: 'module' },
  env: { es6: true }
})

tester.run('arithmetic-deprecation-probe', arithmetic, {
  valid: ['BigNumber(1).plus(2);'],
  invalid: [
    {
      code: '1 + 2;',
      errors: [{ message: /financial calculation/ }]
    },
    {
      code: 'const x = 1; x + 2;',
      errors: [{ message: /financial calculation/ }]
    }
  ]
})

// Allow async emit of warnings
setImmediate(() => {
  const list = [...warnings].sort()
  process.stdout.write('DEPRECATIONS_BEGIN\n')
  process.stdout.write(list.join('\n'))
  if (list.length) process.stdout.write('\n')
  process.stdout.write('DEPRECATIONS_END\n')
})
