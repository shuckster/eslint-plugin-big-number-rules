module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../lib/rules/bitwise')

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
  const { construct: BigNumber, bitwise = {}, supportsBitwise = true } = config

  const { ['>>']: shiftedBy, ['<<']: unshiftedBy } = extractMethods(bitwise)

  const bitwiseTests = supportsBitwise
    ? [
        {
          code: `1 >>> 2;`,
          output: `${BigNumber}(1).${shiftedBy}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `1 >> 2;`,
          output: `${BigNumber}(1).${shiftedBy}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `1 << 2;`,
          output: `${BigNumber}(1).${shiftedBy}(-2);`,
          errors: expectingErrors(1)
        },
        {
          code: `1 << two();`,
          output: `${BigNumber}(1).${unshiftedBy}(-two());`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) >> ${BigNumber}(2);`,
          output: `${BigNumber}(1).${shiftedBy}(${BigNumber}(2));`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) >>> ${BigNumber}(2);`,
          output: `${BigNumber}(1).${shiftedBy}(${BigNumber}(2));`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) << ${BigNumber}(2);`,
          output: `${BigNumber}(1).${unshiftedBy}(-${BigNumber}(2));`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) << ${BigNumber}(two());`,
          output: `${BigNumber}(1).${unshiftedBy}(-${BigNumber}(two()));`,
          errors: expectingErrors(1)
        }
      ]
    : [
        {
          code: `1 >>> 2;`,
          errors: expectingErrors(1)
        },
        {
          code: `1 << 2;`,
          errors: expectingErrors(1)
        },
        {
          code: `1 << two();`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) >> ${BigNumber}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) >>> ${BigNumber}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) << ${BigNumber}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `${BigNumber}(1) << ${BigNumber}(two());`,
          errors: expectingErrors(1)
        }
      ]

  const tests = [...bitwiseTests]

  return {
    name: 'bitwise',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
