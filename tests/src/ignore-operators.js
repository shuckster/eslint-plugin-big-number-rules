module.exports = {
  makeTests
}

const {baseEslintSettings, expectingErrors, errorWithSuggestions } = require('./common')

const arithmeticRule = require('../../lib/rules/arithmetic')
const assignmentRule = require('../../lib/rules/assignment')
const bitwiseRule = require('../../lib/rules/bitwise')
const comparisonRule = require('../../lib/rules/comparison')

function makeSettings(ignoredOps) {
  return {
    ...baseEslintSettings,
    settings: {
      'big-number-rules': {
        construct: 'BigNumber',
        importDeclaration: '__IGNORE__',
        importSpecifier: '__IGNORE__',
        supportsSum: true,
        supportsBitwise: true,
        sum: 'sum',
        unsafelyIgnoreSuggestionsForOperators: ignoredOps,
        arithmetic: {
          '+': 'plus',
          '-': 'minus',
          '/': 'dividedBy',
          '*': 'multipliedBy',
          '**': 'exponentiatedBy',
          '%': 'modulo'
        },
        assignment: {
          '+=': 'plus',
          '-=': 'minus',
          '/=': 'dividedBy',
          '*=': 'multipliedBy',
          '**=': 'exponentiatedBy',
          '%=': 'modulo',
          '>>=': 'shiftedBy',
          '>>>=': 'shiftedBy',
          '<<=': ['${L}', 'shiftedBy', '-${R}']
        },
        comparison: {
          '<': 'isLessThan',
          '<=': 'isLessThanOrEqualTo',
          '===': 'isEqualTo',
          '==': 'isEqualTo',
          '!==': ['__NEGATION__', '${L}', 'isEqualTo', '${R}'],
          '!=': ['__NEGATION__', '${L}', 'isEqualTo', '${R}'],
          '>=': 'isGreaterThanOrEqualTo',
          '>': 'isGreaterThan'
        },
        bitwise: {
          '>>': 'shiftedBy',
          '>>>': 'shiftedBy',
          '<<': ['${L}', 'shiftedBy', '-${R}']
        }
      }
    }
  }
}

function makeTests() {
  return [
    //
    // Arithmetic: ignore "+"
    //
    {
      name: 'arithmetic (+ ignored)',
      rule: arithmeticRule,
      eslintSettings: makeSettings(['+']),
      testCases: {
        valid: [
          { code: `1 + 2;` },
          { code: `1 + 2 + 3;` }
        ],
        invalid: [
          {
            code: `1 - 2;`,
            output: `BigNumber(1).minus(2);`,
            errors: expectingErrors(1)
          },
          {
            code: `1 * 2;`,
            output: `BigNumber(1).multipliedBy(2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    },

    //
    // Assignment: ignore "+="
    //
    {
      name: 'assignment (+= ignored)',
      rule: assignmentRule,
      eslintSettings: makeSettings(['+=']),
      testCases: {
        valid: [
          { code: `a += 2;` }
        ],
        invalid: [
          {
            code: `a -= 2;`,
            output: `a = BigNumber(a).minus(2);`,
            errors: expectingErrors(1)
          },
          {
            code: `a *= 2;`,
            output: `a = BigNumber(a).multipliedBy(2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    },

    //
    // Comparison: ignore "===" and "!=="
    //
    {
      name: 'comparison (=== and !== ignored)',
      rule: comparisonRule,
      eslintSettings: makeSettings(['===', '!==']),
      testCases: {
        valid: [
          { code: `1 === 2;` },
          { code: `1 !== 2;` }
        ],
        invalid: [
          {
            code: `1 < 2;`,
            output: `BigNumber(1).isLessThan(2);`,
            errors: expectingErrors(1)
          },
          {
            code: `1 > 2;`,
            output: `BigNumber(1).isGreaterThan(2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    },

    //
    // Bitwise: ignore ">>"
    //
    {
      name: 'bitwise (>> ignored)',
      rule: bitwiseRule,
      eslintSettings: makeSettings(['>>']),
      testCases: {
        valid: [
          { code: `1 >> 2;` }
        ],
        invalid: [
          {
            code: `1 << 2;`,
            output: `BigNumber(1).shiftedBy(-2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    },

    //
    // Combined: ignore both "+" (arithmetic) and "+=" (assignment)
    //
    {
      name: 'arithmetic (+ and += ignored together)',
      rule: arithmeticRule,
      eslintSettings: makeSettings(['+', '+=']),
      testCases: {
        valid: [
          { code: `1 + 2;` },
          { code: `1 + 2 + 3;` }
        ],
        invalid: [
          {
            code: `1 - 2;`,
            output: `BigNumber(1).minus(2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    },

    //
    // Verify that an empty ignore list leaves all operators flagged
    //
    {
      name: 'arithmetic (no operators ignored)',
      rule: arithmeticRule,
      eslintSettings: makeSettings([]),
      testCases: {
        valid: [],
        invalid: [
          {
            code: `1 + 2;`,
            errors: [
            errorWithSuggestions([
                  {
                    desc: `Yes, make it: BigNumber.sum(1, 2)`,
                    output: `BigNumber.sum(1, 2);`
                  },
                  {
                    desc: `No, make it: ('').concat(1, 2)`,
                    output: "('').concat(1, 2);"
                  },
                  {
                    desc: 'No, make it: `${1}${2}`',
                    output: '`${1}${2}`;'
                  }
                ])
            ]
          },
          {
            code: `1 - 2;`,
            output: `BigNumber(1).minus(2);`,
            errors: expectingErrors(1)
          }
        ]
      }
    }
  ]
}
