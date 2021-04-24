const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/math')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // Math.*
  //
  {
    code: 'Math.min(1, 2, 3);',
    output: 'BigNumber.minimum(1, 2, 3);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.max(1, 2, 3);',
    output: 'BigNumber.maximum(1, 2, 3);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.random();',
    output: 'BigNumber.random();',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.abs(-1.5);',
    output: 'BigNumber.absoluteValue(-1.5);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.sign(5);',
    output: 'BigNumber(5).comparedTo(0);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.sign(-6);',
    output: 'BigNumber(-6).comparedTo(0);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.sqrt();',
    output: 'BigNumber.squareRoot();',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('math', rule, {
  valid: validTests,
  invalid: invalidTests
})
