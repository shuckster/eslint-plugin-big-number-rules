const { getConstruct } = require('./settings')

//
// Global identifier helpers
//

function makeIdentifierMembershipDetector(rootConstruct) {
  return (context, node) => {
    const parentNode = node.parent
    if (parentNode.type !== 'MemberExpression') {
      return false
    }

    const construct = rootConstruct.replace(
      '__CONSTRUCT__',
      getConstruct(context)
    )

    const isInstanceMember =
      parentNode?.object?.type === 'CallExpression' &&
      parentNode?.object?.callee?.type === 'Identifier' &&
      parentNode?.object?.callee?.name === construct

    const isStaticMember =
      parentNode?.object?.type === 'Identifier' &&
      parentNode?.object?.name === construct

    return isInstanceMember || isStaticMember
  }
}

const IdentifierIsAlreadyBigNumberMethod = makeIdentifierMembershipDetector(
  '__CONSTRUCT__'
)

function makeGlobalIdentifierFixer(globalMethods) {
  const supportedGlobals = Object.keys(globalMethods)

  return context => {
    return node => {
      if (!supportedGlobals.includes(node.name)) {
        return
      }
      if (IdentifierIsAlreadyBigNumberMethod(context, node)) {
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
  IdentifierIsAlreadyBigNumberMethod,
  makeIdentifierMembershipDetector,
  makeGlobalIdentifierFixer
}
