const RuleTester = require('eslint').RuleTester
const { eslintSettings, expectingErrors } = require('./common')

const rule = require('../../lib/rules/arithmetic')
const ruleTester = new RuleTester(eslintSettings)

const tests = [
  //
  // Arithmetic
  //
  {
    code: '1 + 2 + 3;',
    output: 'BigNumber.sum(1, 2, 3);',
    errors: expectingErrors(1)
  },
  {
    code: '1 + two() + -3;',
    output: 'BigNumber.sum(1, two(), -3);',
    errors: expectingErrors(1)
  },
  {
    code: '1 - 2;',
    output: 'BigNumber(1).minus(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 / 2;',
    output: 'BigNumber(1).dividedBy(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 * 2;',
    output: 'BigNumber(1).multipliedBy(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 ** 2;',
    output: 'BigNumber(1).exponentiatedBy(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 % 2;',
    output: 'BigNumber(1).modulo(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 < 2;',
    output: 'BigNumber(1).isLessThan(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 <= 2;',
    output: 'BigNumber(1).isLessThanOrEqualTo(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 === 2;',
    output: 'BigNumber(1).isEqualTo(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 == 2;',
    output: 'BigNumber(1).isEqualTo(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 >= 2;',
    output: 'BigNumber(1).isGreaterThanOrEqualTo(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 > 2;',
    output: 'BigNumber(1).isGreaterThan(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 >> 2;',
    output: 'BigNumber(1).shiftedBy(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 >>> 2;',
    output: 'BigNumber(1).shiftedBy(2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 << 2;',
    output: 'BigNumber(1).shiftedBy(-2);',
    errors: expectingErrors(1)
  },
  {
    code: '1 << two();',
    output: 'BigNumber(1).shiftedBy(-two());',
    errors: expectingErrors(1)
  },

  //
  // Add to existing chains
  //
  {
    code: 'BigNumber(1) + 2;',
    output: 'BigNumber(1).plus(2);',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) - two;',
    output: 'BigNumber(1).minus(two);',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) / two();',
    output: 'BigNumber(1).dividedBy(two());',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) * BigNumber(2);',
    output: 'BigNumber(1).multipliedBy(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) ** BigNumber(2);',
    output: 'BigNumber(1).exponentiatedBy(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) % BigNumber(2);',
    output: 'BigNumber(1).modulo(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) < BigNumber(2);',
    output: 'BigNumber(1).isLessThan(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) <= BigNumber(2);',
    output: 'BigNumber(1).isLessThanOrEqualTo(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) === BigNumber(2);',
    output: 'BigNumber(1).isEqualTo(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) == BigNumber(2);',
    output: 'BigNumber(1).isEqualTo(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) >= BigNumber(2);',
    output: 'BigNumber(1).isGreaterThanOrEqualTo(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) > BigNumber(2);',
    output: 'BigNumber(1).isGreaterThan(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) >> BigNumber(2);',
    output: 'BigNumber(1).shiftedBy(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) >>> BigNumber(2);',
    output: 'BigNumber(1).shiftedBy(BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) << BigNumber(2);',
    output: 'BigNumber(1).shiftedBy(-BigNumber(2));',
    errors: expectingErrors(1)
  },
  {
    code: 'BigNumber(1) << BigNumber(two());',
    output: 'BigNumber(1).shiftedBy(-BigNumber(two()));',
    errors: expectingErrors(1)
  }
]

const invalidTests = tests
const validTests = tests.map(test => test.output).filter(Boolean)

ruleTester.run('arithmetic', rule, {
  valid: validTests,
  invalid: invalidTests
})
