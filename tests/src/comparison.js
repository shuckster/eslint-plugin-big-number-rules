module.exports = {
  makeTest
}

const { expectingErrors } = require('./common')
const rule = require('../../lib/rules/comparison')

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
  const { construct: BigNumber, comparison } = config

  const {
    ['<']: isLessThan,
    ['<=']: isLessThanOrEqualTo,
    ['===']: isStrictlyEqualTo,
    ['==']: isEqualTo,
    ['>=']: isGreaterThanOrEqualTo,
    ['>']: isGreaterThan
  } = extractMethods(comparison)

  const tests = [
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
      errors: [
        {
          suggestions: [
            {
              desc: `Yes: Change to ${BigNumber}(1).${isStrictlyEqualTo}(2)`,
              output: `${BigNumber}(1).${isStrictlyEqualTo}(2);`
            },
            {
              desc: `No: Change to Object.is(1, 2)`,
              output: 'Object.is(1, 2);'
            }
          ]
        }
      ]
    },
    {
      code: `1 == 2;`,
      errors: [
        {
          suggestions: [
            {
              desc: `Yes: Change to ${BigNumber}(1).${isEqualTo}(2)`,
              output: `${BigNumber}(1).${isEqualTo}(2);`
            },
            {
              desc: `No: Change to Object.is(1, 2)`,
              output: 'Object.is(1, 2);'
            }
          ]
        }
      ]
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
      code: `${BigNumber}(1) !== ${BigNumber}(2);`,
      output: `!${BigNumber}(1).${isStrictlyEqualTo}(${BigNumber}(2));`,
      errors: expectingErrors(1)
    },
    {
      code: `${BigNumber}(1) != ${BigNumber}(2);`,
      output: `!${BigNumber}(1).${isEqualTo}(${BigNumber}(2));`,
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
    name: 'comparison',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
