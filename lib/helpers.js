const { match, when, otherwise } = require('match-iz')
const { getConstruct, getImportDeclaration } = require('./settings')

function withImportDeclaration(context, fn) {
  const importDeclarationSetting = getImportDeclaration(context)
  if (importDeclarationSetting === '__IGNORE__') {
    return fn
  }
  return node => {
    const [root] = context.getAncestors()
    const importDeclaration = root?.body?.find(
      x =>
        x?.type === 'ImportDeclaration' &&
        x?.source?.value === importDeclarationSetting
    )
    if (importDeclaration) {
      return fn(node)
    }
  }
}

function nodeArgumentsAsString(context) {
  return node => node.arguments.map(x => context.getSource(x)).join(', ')
}

//
// Global identifier helpers
//

function identifierIsGlobalCallExpression(node) {
  return (
    node?.type === 'Identifier' &&
    node?.parent?.type === 'CallExpression' &&
    node?.parent?.callee === node
  )
}

function ownerOfMemberExpression(node) {
  if (
    node?.type !== 'Identifier' &&
    node?.parent?.type !== 'MemberExpression'
  ) {
    return null
  }

  return match(node?.parent?.object)(
    when({ type: 'Identifier' })(o => o?.name),
    when({ type: 'CallExpression' })(o => o?.callee?.name),
    otherwise(null)
  )
}

function makeIdentifierMembershipDetector(rootConstruct) {
  return (context, node) => {
    if (identifierIsGlobalCallExpression(node)) {
      return false
    }
    const owner = ownerOfMemberExpression(node)
    if (owner === null) {
      return false
    }

    const construct = rootConstruct.replace(
      '__CONSTRUCT__',
      getConstruct(context)
    )

    return construct === owner
  }
}

const IdentifierIsAlreadyBigNumberMethod =
  makeIdentifierMembershipDetector('__CONSTRUCT__')

function makeGlobalIdentifierFixer(globalMethods) {
  const supportedStatics = {}
  const supportedGlobals = Object.keys(globalMethods).filter(key => {
    if (key.includes('.')) {
      const [left, right] = key.split('.')
      supportedStatics[right] = makeIdentifierMembershipDetector(left)
      return false
    }
    return true
  })

  return context => {
    return node => {
      if (IdentifierIsAlreadyBigNumberMethod(context, node)) {
        return
      }

      const original = context.getSource(node)

      if (
        supportedGlobals.includes(node.name) &&
        identifierIsGlobalCallExpression(node)
      ) {
        context.report({
          node,
          message: `is '${original}' a financial calculation?`,
          fix: fixer => {
            const fn = globalMethods[node.name]
            return fixer.replaceText(node, fn(context))
          }
        })
        return
      }

      const isStatic = supportedStatics[node.name]
      if (typeof isStatic === 'function' && isStatic(context, node)) {
        context.report({
          node: node.parent,
          message: `is '${original}' a financial calculation?`,
          fix: fixer => {
            const fn = globalMethods[node.name]
            return fixer.replaceText(node.parent, fn(context))
          }
        })
      }
    }
  }
}

module.exports = {
  IdentifierIsAlreadyBigNumberMethod,
  makeIdentifierMembershipDetector,
  makeGlobalIdentifierFixer,
  withImportDeclaration,
  nodeArgumentsAsString
}
