const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/is-nan')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // isNaN
  //
  {
    code: 'isNaN(NaN);',
    output: 'BigNumber.isNaN(NaN);',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('isNaN', rule, {
  valid: validTests,
  invalid: invalidTests
})
