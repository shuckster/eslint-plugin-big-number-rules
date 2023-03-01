const { match, when, against, otherwise, anyOf } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')
const { isWorkable, isBigNumberChain } = require('./_abc')

//
// Settings
//

const comparisonMethods = {
  '<': 'isLessThan',
  '<=': 'isLessThanOrEqualTo',
  '===': 'isEqualTo',
  '==': 'isEqualTo',
  '!==': ['__NEGATION__', '${L}', 'isEqualTo', '${R}'],
  '!=': ['__NEGATION__', '${L}', 'isEqualTo', '${R}'],
  '>=': 'isGreaterThanOrEqualTo',
  '>': 'isGreaterThan'
}

const isAdvancedReplacer = method =>
  Array.isArray(method) && [3, 4].includes(method.length)

const getComparisonMethods = makeSettingGetter('comparison', comparisonMethods)

//
// Arithmetic
//

function arithmeticEntry(context) {
  const construct = getConstruct(context)

  // FIXME: Arithmetic + comparison smooshed together for now
  const arithmeticMethods = getComparisonMethods(context)

  const isArithmeticOperator = anyOf(Object.keys(arithmeticMethods))
  const allMethods = arithmeticMethods

  const SuggestArithmeticReplacement = SuggestReplacement

  return against(
    when({
      type: 'BinaryExpression',
      operator: isArithmeticOperator,
      left: isWorkable,
      right: isWorkable
    })(SuggestArithmeticReplacement)
  )

  function SuggestReplacement(node) {
    const original = context.getSource(node)
    const chainable = isBigNumberChain(context, node.left)

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const { operator } = node
        const L = context.getSource(node.left)
        const R = context.getSource(node.right)

        const [isNegated, left, method, right] = match(allMethods[operator])(
          when(isAdvancedReplacer)($ => {
            const result = $.map(one =>
              one
                .replace('__CONSTRUCT__', construct)
                .replace('${L}', L)
                .replace('${R}', R)
            )

            if (result.length === 3) result.unshift('')
            const [prefix, ...rest] = result
            const isNegated = prefix === '__NEGATION__'
            return [isNegated, ...rest]
          }),

          otherwise(method => ['', L, method, R])
        )

        const prefix = isNegated ? '!' : ''

        return fixer.replaceText(
          node,
          chainable
            ? `${prefix}${L}.${method}(${right})`
            : `${prefix}${construct}(${left}).${method}(${right})`
        )
      }
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    BinaryExpression: withImportDeclaration(context, arithmeticEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace JavaScript arithmetic with BigNumber methods',
    fixable: 'code'
  }
}
