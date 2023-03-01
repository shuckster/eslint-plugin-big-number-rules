const { match, when, against, otherwise, anyOf } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')
const { isWorkable, isBigNumberChain } = require('./_abc')

//
// Settings
//

const arithmeticMethods = {
  '+': 'plus', // sum() takes precedence where possible. Will be used in chains
  '-': 'minus',
  '/': 'dividedBy',
  '*': 'multipliedBy',
  '**': 'exponentiatedBy',
  '%': 'modulo'
}

const isAdvancedReplacer = method =>
  Array.isArray(method) && [3, 4].includes(method.length)

const getArithmeticMethods = makeSettingGetter('arithmetic', arithmeticMethods)
const getSumMethod = makeSettingGetter('sum', 'sum')
const getSupportsSum = makeSettingGetter('supportsSum', true)

//
// Detect sums with a stack
//

const stack = []

//
// Arithmetic
//

function arithmeticEntry(context) {
  const construct = getConstruct(context)

  const arithmeticMethods = getArithmeticMethods(context)
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
    const isSumSupported = getSupportsSum(context)
    const summable = isSumSupported && isSummable(node)
    const chainable = isBigNumberChain(context, node.left)

    stack.push({
      node,
      original,
      summable: summable && !chainable,
      report: {
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
      }
    })
  }
}

//
// See if we can perform a sum when leaving a node
//

function arithmeticExit(context) {
  return exitNode => {
    if (!inStack(exitNode)) {
      return
    }

    const { node, original, summable, report } = stack.pop()

    if (!summable) {
      context.report(report)
      return
    }

    if (!immediateParentIsSummable(node)) {
      context.report({
        node,
        message: `is '${original}' a financial calculation?`,
        fix: fixer => {
          const members = sumMembers(context, node).join(', ')
          return fixer.replaceText(
            node,
            `${getConstruct(context)}.${getSumMethod(context)}(${members})`
          )
        }
      })
    }
  }
}

//
// Helpers
//

function isSummable(node) {
  try {
    if (node.type !== 'BinaryExpression') {
      return true
    }
    if (node.operator !== '+') {
      throw new Error('not a +')
    }
    return isSummable(node.left) && isSummable(node.right)
  } catch (e) {
    return false
  }
}

function inStack(specificNode) {
  return !!stack.find(({ node }) => node === specificNode)
}

function immediateParentIsSummable() {
  if (!stack.length) {
    return false
  }
  return stack[stack.length - 1]?.summable ?? false
}

function sumMembers(context, node) {
  if (node.type !== 'BinaryExpression') {
    return [context.getSource(node)]
  }
  return [
    ...sumMembers(context, node.left),
    ...sumMembers(context, node.right)
  ].flat()
}

//
// Expose
//

module.exports = {
  create: context => ({
    BinaryExpression: withImportDeclaration(context, arithmeticEntry(context)),
    'BinaryExpression:exit': withImportDeclaration(
      context,
      arithmeticExit(context)
    )
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace JavaScript arithmetic with BigNumber methods',
    fixable: 'code'
  }
}
