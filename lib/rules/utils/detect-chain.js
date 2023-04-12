const {
  CallExpressionIsBigNumber,
  CallExpressionIsMemberExpression
} = require('./call-expressions')

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
// Expose
//

module.exports = {
  isBigNumberChain
}
