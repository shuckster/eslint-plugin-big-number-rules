module.exports = {
  makeTest
}

const { expectingErrors, memberExpression } = require('./common')
const rule = require('../../src/rules/math')

function makeTest(config) {
  const tests = [
    //
    // Math.*
    //
    {
      code: 'Math.min(1, 2, 3);',
      output: memberExpression(config, 'math', 'min', '1, 2, 3'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.max(4, 5, 6);',
      output: memberExpression(config, 'math', 'max', '4, 5, 6'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.random();',
      output: memberExpression(config, 'math', 'random', ''),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.abs(-1.5);',
      output: memberExpression(config, 'math', 'abs', '-1.5'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.sign(5);',
      output: memberExpression(config, 'math', 'sign', '5'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.sign(-6);',
      output: memberExpression(config, 'math', 'sign', '-6'),
      errors: expectingErrors(1)
    },
    {
      code: 'Math.sqrt(2);',
      output: memberExpression(config, 'math', 'sqrt', '2'),
      errors: expectingErrors(1)
    }
  ]

  return {
    name: 'math',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
