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
  '>=': 'isGreaterThanOrEqualTo',
  '>': 'isGreaterThan'
}

// TODO: Break this out into its own ruleset (eg; big-number-rules/bitwise)
const bitwiseMethods = {
  '>>': 'shiftedBy',
  '>>>': 'shiftedBy',
  '<<': ['${L}', 'shiftedBy', '-${R}']
}

const getArithmeticMethods = makeSettingGetter('arithmetic', arithmeticMethods)
const getComparisonMethods = makeSettingGetter('comparison', comparisonMethods)
const getBitwiseMethods = makeSettingGetter('bitwise', bitwiseMethods)
const getSumMethod = makeSettingGetter('sum', 'sum')
const getSupportsSum = makeSettingGetter('supportsSum', true)
const getSupportsBitwise = makeSettingGetter('supportsBitwise', true)

//
// Helpers
//

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

//
// Detect sums with a stack
//

const stack = []

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

//
// Arithmetic
//

function arithmeticEntry(context) {
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

  function makeBinaryExpressionReplacer(method) {
    return (L, R) =>
      method.map(one =>
        one
          .replace('__CONSTRUCT__', getConstruct(context))
          .replace('${L}', L)
          .replace('${R}', R)
      )
  }

  function isCustomBinaryExpressionReplacer(method) {
    return (
      Array.isArray(method) &&
      method.length === 3 &&
      method.every(one => typeof one === 'string')
    )
  }

  function getArithmeticMethod(L, operator, R) {
    const method = allMethods[operator]
    const K = (L, R) => [L, method, R]
    const fn = isCustomBinaryExpressionReplacer(method)
      ? makeBinaryExpressionReplacer(method)
      : K

    return fn(L, R)
  }

  function bigNumberArithmetic(context, L, operator, R) {
    const construct = getConstruct(context)
    const [left, method, right] = getArithmeticMethod(L, operator, R)
    return `${construct}(${left}).${method}(${right})`
  }

  function bigNumberAddToChain(L, operator, R) {
    const [, method, right] = getArithmeticMethod(L, operator, R)
    return `${L}.${method}(${right})`
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

  return node => {
    const isArithmeticOp = arithmeticOperators.includes(node.operator)
    if (isArithmeticOp) {
      // Bail early if either side is definitely NaN.
      // Avoids stuff that's obviously string concatenation,
      // but won't catch everything
      const { left, right } = node
      if (
        isLiteralThatCannotParseToANumber(left) ||
        isLiteralThatCannotParseToANumber(right)
      ) {
        return
      }

      // Bail if it looks like we're working with ".length". Very
      // unlikely to be a financial calculation!
      if (
        isProbablyALengthMemberExpression(left) ||
        isProbablyALengthMemberExpression(right)
      ) {
        return
      }
    }

    const isBitwiseOp = bitwiseOperators.includes(node.operator)
    if (!isArithmeticOp && !isBitwiseOp) {
      return
    }

    const original = context.getSource(node)

    if (isBitwiseOp && !isBitwiseSupported) {
      const construct = getConstruct(context)
      context.report({
        node,
        message:
          `is '${original}' a financial calculation? ` +
          `If so, bitwise methods are not supported by ${construct}\n`
      })

      return
    }

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
          const { operator, left, right } = node
          const L = context.getSource(left)
          const R = context.getSource(right)

          if (chainable) {
            return fixer.replaceText(node, bigNumberAddToChain(L, operator, R))
          }

          return fixer.replaceText(
            node,
            bigNumberArithmetic(context, L, operator, R)
          )
        }
      }
    })
  }
}

//
// See if we can perform a sum when leaving a node
//

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

function bigNumberSum(context, node) {
  const members = sumMembers(context, node).join(', ')
  return `${getConstruct(context)}.${getSumMethod(context)}(${members})`
}

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
        fix: fixer => fixer.replaceText(node, bigNumberSum(context, node))
      })
    }
  }
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
