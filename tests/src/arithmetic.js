module.exports = {
  makeTest
}

const dedent = require('dedent')
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

  const passThruTests = [
    //
    // Pass-through literals
    //
    { output: `"one" + "two";` },
    { output: `"one" + "two" + "3";` },
    { output: `"one" + "two" + "3" + "four";` },
    {
      output: `
        const obj = { one: "one", two: "two" };
        let val = obj.one + obj.two;
      `
    },
    {
      output: `
        const arr = ["one", "two"];
        let val = arr[0] + arr[1];
      `
    },
    {
      output: `
        const arr = [{ val: "one" }, { val:"two" }];
        let val = arr[0].val + arr[1].val;
      `
    },
    {
      output: `
        const arr = [{ val: "one" }, { val: ["two"] }];
        let val = arr[0].val + arr[1].val[0];
      `
    }
  ]

  const sumTests = supportsSum
    ? [
        {
          code: `1 + 2 + 3;`,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes, make it: ${BigNumber}.${sum}(1, 2, 3)`,
                  output: `${BigNumber}.${sum}(1, 2, 3);`
                },
                {
                  desc: `No, make it: ('').concat(1, 2, 3)`,
                  output: "('').concat(1, 2, 3);"
                },
                {
                  desc: 'No, make it: `${1}${2}${3}`',
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
                  desc: `Yes, make it: ${BigNumber}.${sum}(1, two(), -3)`,
                  output: `${BigNumber}.${sum}(1, two(), -3);`
                },
                {
                  desc: `No, make it: ('').concat(1, two(), -3)`,
                  output: "('').concat(1, two(), -3);"
                },
                {
                  desc: 'No, make it: `${1}${two()}${-3}`',
                  output: '`${1}${two()}${-3}`;'
                }
              ]
            }
          ]
        },
        ...passThruTests,
        {
          code: dedent`
            const arr = [{ val: "1" }, { val: ["2"] }];
            let val = arr[0].val + arr[1].val[0];
          `,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes, make it: ${BigNumber}.${sum}(arr[0].val, arr[1].val[0])`,
                  output: dedent`
                    const arr = [{ val: "1" }, { val: ["2"] }];
                    let val = ${BigNumber}.${sum}(arr[0].val, arr[1].val[0]);
                  `
                },
                {
                  desc: `No, make it: ('').concat(arr[0].val, arr[1].val[0])`,
                  output: dedent`
                    const arr = [{ val: "1" }, { val: ["2"] }];
                    let val = ('').concat(arr[0].val, arr[1].val[0]);
                  `
                },
                {
                  desc: 'No, make it: `${arr[0].val}${arr[1].val[0]}`',
                  output:
                    'const arr = [{ val: "1" }, { val: ["2"] }];\n' +
                    'let val = `${arr[0].val}${arr[1].val[0]}`;'
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
                  desc: `Yes, make it: ${BigNumber}(1).${plus}(2)`,
                  output: `${BigNumber}(1).${plus}(2);`
                },
                {
                  desc: `No, make it: ('').concat(1, 2)`,
                  output: "('').concat(1, 2);"
                },
                {
                  desc: 'No, make it: `${1}${2}`',
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
                  desc: `Yes, make it: ${BigNumber}(1).${plus}(two())`,
                  output: `${BigNumber}(1).${plus}(two());`
                },
                {
                  desc: `No, make it: ('').concat(1, two())`,
                  output: "('').concat(1, two());"
                },
                {
                  desc: 'No, make it: `${1}${two()}`',
                  output: '`${1}${two()}`;'
                }
              ]
            }
          ]
        },
        ...passThruTests,
        {
          code: dedent`
            const arr = [{ val: "1" }, { val: ["2"] }];
            let val = arr[0].val + arr[1].val[0];
          `,
          errors: [
            {
              suggestions: [
                {
                  desc: `Yes, make it: ${BigNumber}(arr[0].val).${plus}(arr[1].val[0])`,
                  output: dedent`
                    const arr = [{ val: "1" }, { val: ["2"] }];
                    let val = ${BigNumber}(arr[0].val).${plus}(arr[1].val[0]);
                  `
                },
                {
                  desc: `No, make it: ('').concat(arr[0].val, arr[1].val[0])`,
                  output: dedent`
                    const arr = [{ val: "1" }, { val: ["2"] }];
                    let val = ('').concat(arr[0].val, arr[1].val[0]);
                  `
                },
                {
                  desc: 'No, make it: `${arr[0].val}${arr[1].val[0]}`',
                  output:
                    'const arr = [{ val: "1" }, { val: ["2"] }];\n' +
                    'let val = `${arr[0].val}${arr[1].val[0]}`;'
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
    invalidTests: tests.filter(test => test.errors)
  }
}
