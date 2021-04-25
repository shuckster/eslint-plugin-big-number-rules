module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../lib/rules/is-nan')

function makeTest(config) {
  const { construct: BigNumber } = config
  const tests = [
    //
    // isNaN
    //
    {
      code: 'isNaN(NaN);',
      output: `${BigNumber}.isNaN(NaN);`,
      errors: expectingErrors(1)
    }
  ]

  return {
    name: 'isNaN',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
