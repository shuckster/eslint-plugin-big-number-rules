const { getConstruct, getSumMethod } = require('../../settings')

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
  CallExpressionIsMemberExpression,
  CallExpressionIsBigNumber
}
