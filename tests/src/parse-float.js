module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../src/rules/parse-float')

function makeTest(config) {
  const { construct: BigNumber } = config
  const tests = [
    //
    // parseFloat
    //
    {
      code: 'parseFloat(-1.5);',
      output: `${BigNumber}(-1.5);`,
      errors: expectingErrors(1)
    },
    //
    // Regression test for:
    // https://github.com/shuckster/eslint-plugin-big-number-rules/issues/2
    //
    {
      code: 'Object.prototype.hasOwnProperty.call({}); parseFloat(-1.5);',
      output: `Object.prototype.hasOwnProperty.call({}); ${BigNumber}(-1.5);`,
      errors: expectingErrors(1)
    }
  ]

  return {
    name: 'parseFloat',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
