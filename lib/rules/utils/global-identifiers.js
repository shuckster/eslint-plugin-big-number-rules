const { match, when, otherwise } = require('match-iz')
const { isStrictly, anyOf, isString } = require('match-iz')

const { getConstruct } = require('../../settings')
const { hasOwn } = require('../../helpers')

//
// Global identifier helpers
//

function identifierIsGlobalCallExpression(node) {
  return match(node)(
    when({
      type: 'Identifier',
      parent: { type: 'CallExpression', callee: isStrictly(node) }
    })(true),
    otherwise(false)
  )
}

function ownerOfMemberExpression(node) {
  return match(node)(
    when({
      type: 'Identifier',
      parent: {
        type: 'MemberExpression',
        object: anyOf(
          { type: 'Identifier', name: isString },
          { type: 'CallExpression', callee: { name: isString } }
        )
      }
    })(({ parent: { object } }) =>
      match(object)(
        when({ type: 'Identifier' })(o => o.name),
        when({ type: 'CallExpression' })(o => o.callee.name),
        otherwise(null)
      )
    ),

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
  const supportedGlobals = []

  Object.keys(globalMethods).forEach(key => {
    if (key.includes('.')) {
      const [left, right] = key.split('.')
      supportedStatics[right] = makeIdentifierMembershipDetector(left)
    } else {
      supportedGlobals.push(key)
    }
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

      const isStatic =
        hasOwn(supportedStatics, node.name) && supportedStatics[node.name]

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

//
// Expose
//

module.exports = {
  IdentifierIsAlreadyBigNumberMethod,
  makeIdentifierMembershipDetector,
  makeGlobalIdentifierFixer
}
