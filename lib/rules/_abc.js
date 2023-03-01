//
// a = arithmetic
// b = bitwise
// c = comparison
//

const { not, allOf } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')

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
// Helpers
//

const getSumMethod = makeSettingGetter('sum', 'sum')

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

//
// Expose
//

module.exports = {
  isBigNumberChain,
  isLiteralThatCannotParseToANumber,
  isProbablyALengthMemberExpression,
  isWorkable
}
