const { against, when, match, otherwise } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')

//
// Rounding recommendations, or replacements for configs that support it
//

const roundingMethodsOrSuggestions = {
  floor: `BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_FLOOR
})`,
  ceil: `BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_CEIL
})`,
  round: `BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN
})`
}

const getRoundingSupport = makeSettingGetter('supportsRound', false)
const getRoundInfo = makeSettingGetter('rounding', roundingMethodsOrSuggestions)

function mathRoundingEntry(context) {
  const isSupportedStaticMathMethod = Object.keys(roundingMethodsOrSuggestions)
  const roundingMethods = getRoundInfo(context)
  const isRoundingSupported = getRoundingSupport(context)

  const SuggestReplacement = node => {
    const original = context.getSource(node)
    const propertyName = node.callee.property.name

    if (!isRoundingSupported) {
      context.report({
        node,
        message:
          `is '${original}' a financial calculation? ` +
          `If so, use the global constructor setting:\n\n` +
          `${roundingMethods[propertyName]}\n`
      })
      return
    }

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const construct = getConstruct(context)
        const method = roundingMethods[propertyName]
        const A = node.arguments.map(arg => context.getSource(arg)).join(', ')

        return fixer.replaceText(
          node,
          match(method)(
            when({ length: 1 })(method =>
              method[0].replace('__CONSTRUCT__', construct).replace('${A}', A)
            ),

            when({ length: 2 })(method => {
              const _method = method[0]
              const _args = method.slice(1).map(arg => arg.replace('${A}', A))
              return `${construct}.${_method}(${_args})`
            }),

            otherwise(method => `${construct}.${method}(${A})`)
          )
        )
      }
    })
  }

  return against(
    when({
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'Math' },
        property: { name: isSupportedStaticMathMethod }
      }
    })(SuggestReplacement)
  )
}

//
// ~~4.9 === 4 (flooring using bitwise double-not)
//

function doubleNotEntry(context) {
  const roundingMethods = getRoundInfo(context)
  const isRoundingSupported = getRoundingSupport(context)

  const SuggestReplacement = node => {
    const original = context.getSource(node)
    const method = roundingMethods['floor']

    if (!isRoundingSupported) {
      context.report({
        node,
        message:
          `is '${original}' a financial calculation? ` +
          `If so, use the global constructor setting:\n\n` +
          `${method}\n`
      })
      return
    }

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const A = context.getSource(node?.argument?.argument)
        const construct = getConstruct(context)

        return fixer.replaceText(
          node,
          match(method)(
            when({ length: 1 })(method =>
              method[0].replace('__CONSTRUCT__', construct).replace('${A}', A)
            ),

            when({ length: 2 })(method => {
              const _method = method[0]
              const _args = method.slice(1).map(arg => arg.replace('${A}', A))
              return `${construct}.${_method}(${_args})`
            }),

            otherwise(method => `${construct}.${method}(${A})`)
          )
        )
      }
    })
  }

  return against(
    when({
      type: 'UnaryExpression',
      operator: '~',
      argument: { operator: '~' }
    })(SuggestReplacement)
  )
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: withImportDeclaration(context, mathRoundingEntry(context)),
    UnaryExpression: withImportDeclaration(context, doubleNotEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Warn against using JavaScript Math.round|ceil|floor methods, or offer replacements',
    fixable: 'code'
  }
}
