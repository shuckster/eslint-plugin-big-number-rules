const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/parse-float')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // parseFloat
  //
  {
    code: 'parseFloat(-1.5);',
    output: 'BigNumber(-1.5);',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('parseFloat', rule, {
  valid: validTests,
  invalid: invalidTests
})
