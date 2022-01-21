module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../src/rules/assignment')

function extractMethods(ops) {
  return Object.entries(ops).reduce((acc, [key, value]) => {
    const method = Array.isArray(value) ? value[1] : value
    return {
      ...acc,
      [key]: method
    }
  }, {})
}

function makeTest(config) {
  const { construct: BigNumber, assignment, supportsBitwise = true } = config

  const methods = assignment

  const {
    ['+=']: plus,
    ['-=']: minus,
    ['/=']: dividedBy,
    ['*=']: multipliedBy,
    ['**=']: exponentiatedBy,
    ['%=']: modulo,
    ['>>=']: shiftedBy,
    ['<<=']: unshiftedBy
  } = extractMethods(methods)

  const bitwiseTests = supportsBitwise
    ? [
        {
          code: `a >>>= 2;`,
          output: `a = ${BigNumber}(a).${shiftedBy}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `a >>= 2;`,
          output: `a = ${BigNumber}(a).${shiftedBy}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `a <<= 2;`,
          output: `a = ${BigNumber}(a).${shiftedBy}(-2);`,
          errors: expectingErrors(1)
        },
        {
          code: `a <<= two();`,
          output: `a = ${BigNumber}(a).${unshiftedBy}(-two());`,
          errors: expectingErrors(1)
        }
      ]
    : [
        {
          code: `a >>>= 2;`,
          errors: expectingErrors(1)
        },
        {
          code: `a <<= 2;`,
          errors: expectingErrors(1)
        },
        {
          code: `a <<= two();`,
          errors: expectingErrors(1)
        }
      ]

  const tests = [
    ...bitwiseTests,

    //
    // Arithmetic
    //
    {
      code: `a += 2;`,
      output: `a = ${BigNumber}(a).${plus}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `a -= 2;`,
      output: `a = ${BigNumber}(a).${minus}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `a /= 2;`,
      output: `a = ${BigNumber}(a).${dividedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `a *= 2;`,
      output: `a = ${BigNumber}(a).${multipliedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `a **= 2;`,
      output: `a = ${BigNumber}(a).${exponentiatedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `a %= 2;`,
      output: `a = ${BigNumber}(a).${modulo}(2);`,
      errors: expectingErrors(1)
    }
  ]

  return {
    name: 'assignment',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
