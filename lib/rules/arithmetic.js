const { match, when, against, otherwise, not, allOf } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')

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

// TODO: Break this out into its own ruleset (eg; big-number-rules/comparison)
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

// TODO: Break this out into its own ruleset (eg; big-number-rules/bitwise)
const bitwiseMethods = {
  '>>': 'shiftedBy',
  '>>>': 'shiftedBy',
  '<<': ['${L}', 'shiftedBy', '-${R}']
}

const isAdvancedReplacer = method =>
  Array.isArray(method) && [3, 4].includes(method.length)

const getArithmeticMethods = makeSettingGetter('arithmetic', arithmeticMethods)
const getComparisonMethods = makeSettingGetter('comparison', comparisonMethods)
const getBitwiseMethods = makeSettingGetter('bitwise', bitwiseMethods)
const getSumMethod = makeSettingGetter('sum', 'sum')
const getSupportsSum = makeSettingGetter('supportsSum', true)
const getSupportsBitwise = makeSettingGetter('supportsBitwise', true)

//
// Detect sums with a stack
//

const stack = []

//
// Arithmetic
//

function arithmeticEntry(context) {
  const construct = getConstruct(context)
  const isBitwiseSupported = getSupportsBitwise(context)

  // FIXME: Arithmetic + comparison smooshed together for now
  const arithmeticMethods = {
    ...getArithmeticMethods(context),
    ...getComparisonMethods(context)
  }

  const arithmeticOperators = Object.keys(arithmeticMethods)
  const bitwiseMethods = getBitwiseMethods(context)
  const bitwiseOperators = Object.keys(bitwiseMethods)
  const allMethods = {
    ...arithmeticMethods,
    ...bitwiseMethods
  }

  const isWorkable = not(
    allOf(
      // Bail early if either side is definitely NaN.
      // Avoids stuff that's obviously string concatenation,
      // but won't catch everything
      isLiteralThatCannotParseToANumber,

      // Bail if it looks like we're working with ".length".
      // Very unlikely to be a financial calculation!
      isProbablyALengthMemberExpression
    )
  )

  const SuggestArithmeticReplacement = SuggestReplacement

  return against(
    when({
      type: 'BinaryExpression',
      operator: arithmeticOperators,
      left: isWorkable,
      right: isWorkable
    })(SuggestArithmeticReplacement),

    when({
      type: 'BinaryExpression',
      operator: bitwiseOperators,
      left: isWorkable,
      right: isWorkable
    })(SuggestBitwiseReplacement)
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
            when(isAdvancedReplacer)(method => {
              const result = method.map(one =>
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

function CallExpressionIsMemberExpression(node) {
  return (
    node?.type === 'CallExpression' && node?.callee?.type === 'MemberExpression'
  )
}

function CallExpressionIsBigNumberPlain(context, node) {
  return (
    node?.type === 'CallExpression' &&
    node?.callee?.type === 'Identifier' &&
    node?.callee?.name === getConstruct(context)
  )
}

function CallExpressionIsBigNumberSum(context, node) {
  return (
    CallExpressionIsMemberExpression(node) &&
    node?.callee?.object?.type === 'Identifier' &&
    node?.callee?.object?.name === getConstruct(context) &&
    node?.callee?.property?.type === 'Identifier' &&
    node?.callee?.property?.name === getSumMethod(context)
  )
}

function CallExpressionIsBigNumber(context, node) {
  return (
    CallExpressionIsBigNumberPlain(context, node) ||
    CallExpressionIsBigNumberSum(context, node)
  )
}

function isBigNumberChain(context, node) {
  let currentNode = node

  while (!CallExpressionIsBigNumber(context, currentNode)) {
    if (CallExpressionIsMemberExpression(currentNode)) {
      currentNode = currentNode.callee.object
    } else {
      return false
    }
  }

  return true
}

function isLiteralThatCannotParseToANumber(node) {
  const { type, value } = node || {}
  return type === 'Literal' && isNaN(value)
}

function isProbablyALengthMemberExpression(node) {
  return (
    node?.type === 'MemberExpression' &&
    node?.property?.type === 'Identifier' &&
    node?.property?.name === 'length'
  )
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
