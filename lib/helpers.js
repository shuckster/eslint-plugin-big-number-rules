const { getConstruct } = require('./settings')

//
// Global identifier helper
//

function makeGlobalIdentifierFixer(globalMethods) {
  const supportedGlobals = Object.keys(globalMethods)

  return context => {
    return node => {
      if (!supportedGlobals.includes(node.name)) {
        return
      }

      const ancestors = context.getAncestors(node)
      const parentNode = ancestors.pop()
      if (
        parentNode.type === 'MemberExpression' &&
        parentNode?.object?.type === 'Identifier' &&
        parentNode?.object?.name === getConstruct(context)
      ) {
        return
      }

      const original = context.getSource(node)
      context.report({
        node,
        message: `is '${original}' a financial calculation?`,
        fix: fixer => {
          const fn = globalMethods[node.name]
          return fixer.replaceText(node, fn(context))
        }
      })
    }
  }
}

module.exports = {
  makeGlobalIdentifierFixer
}
