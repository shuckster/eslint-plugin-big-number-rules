module.exports = {
  makeTest
}

const { expectingErrors, memberExpression } = require('./common')
const rule = require('../../lib/rules/rounding')

function getRoundTests(config) {
  //
  // Rounding
  //
  return [
    {
      code: '~~1;',
      output: memberExpression(config, 'rounding', 'floor', '1'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.floor(1);',
      output: memberExpression(config, 'rounding', 'floor', '1'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.ceil(2);',
      output: memberExpression(config, 'rounding', 'ceil', '2'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.round(3);',
      output: memberExpression(config, 'rounding', 'round', '3'),
      errors: expectingErrors(1)
    }
  ]
}

function getRoundWarnings() {
  //
  // Just warnings
  //
  return [
    {
      code: '~~1;',
      errors: expectingErrors(1)
    },
    {
      code: 'Math.floor(1);',
      errors: expectingErrors(1)
    },
    {
      code: 'Math.ceil(2);',
      errors: expectingErrors(1)
    },
    {
      code: 'Math.round(3);',
      errors: expectingErrors(1)
    }
  ]
}

function makeTest(config) {
  const { supportsRound = false } = config
  const tests = supportsRound ? getRoundTests(config) : getRoundWarnings()
  return {
    name: 'rounding',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
