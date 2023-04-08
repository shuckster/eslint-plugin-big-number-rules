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
    sum = 'sum',
    supportsSum = true
  } = config

  const {
    ['+']: plus,
    ['-']: minus,
    ['/']: dividedBy,
    ['*']: multipliedBy,
    ['**']: exponentiatedBy,
    ['%']: modulo
  } = extractMethods(arithmetic)

  const sumTests = supportsSum
    ? [
        {
          code: `1 + 2 + 3;`,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes: Change to ${BigNumber}.${sum}(1, 2, 3)`,
                  output: `${BigNumber}.${sum}(1, 2, 3);`
                },
                {
                  desc: `No: Change to ('').concat(1, 2, 3)`,
                  output: "('').concat(1, 2, 3);"
                },
                {
                  desc: 'No: Change to `${1}${2}${3}`',
                  output: '`${1}${2}${3}`;'
                }
              ]
            }
          ]
        },
        {
          code: `1 + two() + -3;`,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes: Change to ${BigNumber}.${sum}(1, two(), -3)`,
                  output: `${BigNumber}.${sum}(1, two(), -3);`
                },
                {
                  desc: `No: Change to ('').concat(1, two(), -3)`,
                  output: "('').concat(1, two(), -3);"
                },
                {
                  desc: 'No: Change to `${1}${two()}${-3}`',
                  output: '`${1}${two()}${-3}`;'
                }
              ]
            }
          ]
        }
      ]
    : [
        {
          code: `1 + 2;`,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes: Change to ${BigNumber}(1).${plus}(2)`,
                  output: `${BigNumber}(1).${plus}(2);`
                },
                {
                  desc: `No: Change to ('').concat(1, 2)`,
                  output: "('').concat(1, 2);"
                },
                {
                  desc: 'No: Change to `${1}${2}`',
                  output: '`${1}${2}`;'
                }
              ]
            }
          ]
        },
        {
          code: `1 + two();`,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes: Change to ${BigNumber}(1).${plus}(two())`,
                  output: `${BigNumber}(1).${plus}(two());`
                },
                {
                  desc: `No: Change to ('').concat(1, two())`,
                  output: "('').concat(1, two());"
                },
                {
                  desc: 'No: Change to `${1}${two()}`',
                  output: '`${1}${two()}`;'
                }
              ]
            }
          ]
        }
      ]

  const tests = [
    ...sumTests,

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
    }
  ]

  return {
    name: 'arithmetic',
    rule,
    validTests: tests.map(test => test.output).filter(Boolean),
    invalidTests: tests
  }
}
