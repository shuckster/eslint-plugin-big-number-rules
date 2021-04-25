module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../lib/rules/arithmetic')

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
  const {
    construct: BigNumber,
    arithmetic,
    bitwise = {},
    sum = 'sum',
    supportsSum = true,
    supportsBitwise = true
  } = config

  const methods = {
    ...arithmetic,
    ...bitwise
  }

  const {
    ['+']: plus,
    ['-']: minus,
    ['/']: dividedBy,
    ['*']: multipliedBy,
    ['**']: exponentiatedBy,
    ['%']: modulo,
    ['<']: isLessThan,
    ['<=']: isLessThanOrEqualTo,
    ['===']: isStrictlyEqualTo,
    ['==']: isEqualTo,
    ['>=']: isGreaterThanOrEqualTo,
    ['>']: isGreaterThan,
    ['>>']: shiftedBy,
    ['<<']: unshiftedBy
  } = extractMethods(methods)

  const sumTests = supportsSum
    ? [
        {
          code: `1 + 2 + 3;`,
          output: `${BigNumber}.${sum}(1, 2, 3);`,
          errors: expectingErrors(1)
        },
        {
          code: `1 + two() + -3;`,
          output: `${BigNumber}.${sum}(1, two(), -3);`,
          errors: expectingErrors(1)
        }
      ]
    : [
        {
          code: `1 + 2;`,
          output: `${BigNumber}(1).${plus}(2);`,
          errors: expectingErrors(1)
        },
        {
          code: `1 + two();`,
          output: `${BigNumber}(1).${plus}(two());`,
          errors: expectingErrors(1)
        }
      ]

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

  const tests = [
    ...sumTests,
    ...bitwiseTests,

    //
    // Arithmetic
    //
    {
      code: `1 - 2;`,
      output: `${BigNumber}(1).${minus}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 / 2;`,
      output: `${BigNumber}(1).${dividedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 * 2;`,
      output: `${BigNumber}(1).${multipliedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 ** 2;`,
      output: `${BigNumber}(1).${exponentiatedBy}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 % 2;`,
      output: `${BigNumber}(1).${modulo}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 < 2;`,
      output: `${BigNumber}(1).${isLessThan}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 <= 2;`,
      output: `${BigNumber}(1).${isLessThanOrEqualTo}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 === 2;`,
      output: `${BigNumber}(1).${isStrictlyEqualTo}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 == 2;`,
      output: `${BigNumber}(1).${isEqualTo}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 >= 2;`,
      output: `${BigNumber}(1).${isGreaterThanOrEqualTo}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `1 > 2;`,
      output: `${BigNumber}(1).${isGreaterThan}(2);`,
      errors: expectingErrors(1)
    },

    //
    // Add to existing chains
    //
    {
      code: `${BigNumber}(1) + 2;`,
      output: `${BigNumber}(1).${plus}(2);`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) - two;`,
      output: `${BigNumber}(1).${minus}(two);`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) / two();`,
      output: `${BigNumber}(1).${dividedBy}(two());`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) * ${BigNumber}(2);`,
      output: `${BigNumber}(1).${multipliedBy}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) ** ${BigNumber}(2);`,
      output: `${BigNumber}(1).${exponentiatedBy}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) % ${BigNumber}(2);`,
      output: `${BigNumber}(1).${modulo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) < ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isLessThan}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) <= ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isLessThanOrEqualTo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) === ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isStrictlyEqualTo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) == ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isEqualTo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) >= ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isGreaterThanOrEqualTo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) > ${BigNumber}(2);`,
      output: `${BigNumber}(1).${isGreaterThan}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    }
  ]

  return {
    name: 'arithmetic',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
