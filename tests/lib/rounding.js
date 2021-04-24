const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/rounding')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // Precision
  //
  {
    code: 'Math.floor(1);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.ceil(1);',
    errors: expectingErrors(1)
  },
  {
    code: 'Math.round(1);',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('rounding', rule, {
  valid: validTests,
  invalid: invalidTests
})
