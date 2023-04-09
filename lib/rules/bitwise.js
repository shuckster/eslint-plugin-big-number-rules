const { match, when, against, otherwise } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration, makeOperatorGuard } = require('../helpers')
const { isWorkable, isBigNumberChain } = require('./_abc')

//
// Settings
//

const bitwiseMethods = {
  '>>': 'shiftedBy',
  '>>>': 'shiftedBy',
  '<<': ['${L}', 'shiftedBy', '-${R}']
}

const isAdvancedReplacer = method =>
  Array.isArray(method) && [3, 4].includes(method.length)

const getBitwiseMethods = makeSettingGetter('bitwise', bitwiseMethods)
const getSupportsBitwise = makeSettingGetter('supportsBitwise', true)

//
// Arithmetic
//

function arithmeticEntry(context) {
  const construct = getConstruct(context)
  const isBitwiseSupported = getSupportsBitwise(context)

  const bitwiseMethods = getBitwiseMethods(context)
  const isBitwiseOperator = makeOperatorGuard(Object.keys(bitwiseMethods))(
    context
  )

  const allMethods = bitwiseMethods

  return against(
    when({
      type: 'BinaryExpression',
      operator: isBitwiseOperator,
      left: isWorkable,
      right: isWorkable
    })(SuggestBitwiseReplacement)
  )

  function SuggestBitwiseReplacement(node) {
    if (isBitwiseSupported) {
      return SuggestReplacement(node)
    }

    const original = context.getSource(node)

    context.report({
      node,
      message:
        `is '${original}' a financial calculation? ` +
        `If so, bitwise methods are not supported by ${construct}\n`
    })
  }

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
    description:
      'Replace JavaScript bitwise-expressions with BigNumber methods',
    fixable: 'code'
  }
}
