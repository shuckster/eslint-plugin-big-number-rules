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
    },
    {
      code: 'Number.isNaN(NaN);',
      output: `${BigNumber}.isNaN(NaN);`,
      errors: expectingErrors(1)
    },
    {
      output: 'likelyAlreadyABigNumber.isNaN(NaN);'
    }
  ]

  return {
    name: 'isNaN',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests.filter(test => !!test.code)
  }
}
