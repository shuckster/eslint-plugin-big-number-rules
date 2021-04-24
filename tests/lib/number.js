const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/number')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // Number.prototype.*
  //
  {
    code: '(1).toFixed(2);',
    output: 'BigNumber(1).decimalPlaces(2);',
    errors: expectingErrors(1)
  },
  {
    code: 'one.toFixed(3);',
    output: 'BigNumber(one).decimalPlaces(3);',
    errors: expectingErrors(1)
  },
  {
    code: 'one().toFixed(4);',
    output: 'BigNumber(one()).decimalPlaces(4);',
    errors: expectingErrors(1)
  },

  {
    code: '(1).toExponential(2);',
    output: 'BigNumber(1).toExponential(2);',
    errors: expectingErrors(1)
  },
  {
    code: 'one.toExponential(3);',
    output: 'BigNumber(one).toExponential(3);',
    errors: expectingErrors(1)
  },
  {
    code: 'one().toExponential(4);',
    output: 'BigNumber(one()).toExponential(4);',
    errors: expectingErrors(1)
  },

  {
    code: '(1).toPrecision(2);',
    output: 'BigNumber(1).toPrecision(2);',
    errors: expectingErrors(1)
  },
  {
    code: 'one.toPrecision(3);',
    output: 'BigNumber(one).toPrecision(3);',
    errors: expectingErrors(1)
  },
  {
    code: 'one().toPrecision(4);',
    output: 'BigNumber(one()).toPrecision(4);',
    errors: expectingErrors(1)
  },

  {
    code: '(1).toString(2);',
    output: 'BigNumber(1).toString(2);',
    errors: expectingErrors(1)
  },
  {
    code: 'one.toString(3);',
    output: 'BigNumber(one).toString(3);',
    errors: expectingErrors(1)
  },
  {
    code: 'one().toString(4);',
    output: 'BigNumber(one()).toString(4);',
    errors: expectingErrors(1)
  },

  //
  // Number.static.*
  //
  {
    code: 'Number.parseFloat("1.2");',
    output: 'BigNumber("1.2");',
    errors: expectingErrors(1)
  },
  {
    code: 'Number.parseFloat(onePointTwo);',
    output: 'BigNumber(onePointTwo);',
    errors: expectingErrors(1)
  },
  {
    code: 'Number.parseFloat(onePointTwo());',
    output: 'BigNumber(onePointTwo());',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('number', rule, {
  valid: validTests,
  invalid: invalidTests
})
