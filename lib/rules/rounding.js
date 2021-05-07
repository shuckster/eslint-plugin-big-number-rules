const { makeSettingGetter, getConstruct } = require('../settings')

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
  const supportedConstants = Object.keys(roundingMethodsOrSuggestions)
  const roundingMethods = getRoundInfo(context)
  const isRoundingSupported = getRoundingSupport(context)

  function bigNumberRoundingReplacement(context, node, name) {
    const method = roundingMethods[name]
    const args = node.arguments.map(arg => context.getSource(arg)).join(', ')
    const construct = getConstruct(context)

    if (Array.isArray(method)) {
      if (method.length === 1) {
        return method[0]
          .replace('__CONSTRUCT__', construct)
          .replace('${A}', args)
      }

      if (method.length === 2) {
        const _method = method[0]
        const _args = method.slice(1).map(arg => arg.replace('${A}', args))
        return `${construct}.${_method}(${_args})`
      }
    }

    return `${construct}.${method}(${args})`
  }

  return node => {
    const { callee } = node
    if (callee.type !== 'MemberExpression') {
      return
    }
    if (callee?.object?.name !== 'Math') {
      return
    }

    const propertyName = callee?.property?.name
    if (!supportedConstants.includes(propertyName)) {
      return
    }

    const original = context.getSource(node)

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
      fix: fixer =>
        fixer.replaceText(
          node,
          bigNumberRoundingReplacement(context, node, propertyName)
        )
    })
  }
}

//
// ~~4.9 === 4 (flooring using bitwise double-not)
//

function doubleNotEntry(context) {
  const roundingMethods = getRoundInfo(context)
  const isRoundingSupported = getRoundingSupport(context)

  function bigNumberDoubleNotReplacement(context, node) {
    const method = roundingMethods['floor']
    const args = context.getSource(node?.argument?.argument)
    const construct = getConstruct(context)

    if (Array.isArray(method)) {
      if (method.length === 1) {
        return method[0]
          .replace('__CONSTRUCT__', construct)
          .replace('${A}', args)
      }

      if (method.length === 2) {
        const _method = method[0]
        const _args = method.slice(1).map(arg => arg.replace('${A}', args))
        return `${construct}.${_method}(${_args})`
      }
    }

    return `${construct}.${method}(${args})`
  }

  return node => {
    if (node?.operator !== '~') {
      return
    }
    if (node?.argument?.operator !== '~') {
      return
    }

    const original = context.getSource(node)

    if (!isRoundingSupported) {
      context.report({
        node,
        message:
          `is '${original}' a financial calculation? ` +
          `If so, use the global constructor setting:\n\n` +
          `${roundingMethods['floor']}\n`
      })
      return
    }

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer =>
        fixer.replaceText(node, bigNumberDoubleNotReplacement(context, node))
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: mathRoundingEntry(context),
    UnaryExpression: doubleNotEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Warn against using JavaScript Math.round|ceil|floor methods, or offer replacements',
    fixable: 'code'
  }
}
