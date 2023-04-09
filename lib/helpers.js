const matchiz = require('match-iz')
const { sift } = require('sift-r')
const { match, when, otherwise } = matchiz
const { pluck, isString, anyOf, isStrictly } = matchiz
const { allOf, not } = matchiz

const {
  getConstruct,
  getImportDeclaration,
  getImportSpecifier,
  getIgnoredOps
} = require('./settings')

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function cleanArray(array) {
  return array.filter(x => x !== false && x !== null && x !== undefined)
}

function withImportDeclaration(context, fn) {
  const importDeclarationSetting = getImportDeclaration(context)
  if (importDeclarationSetting === '__IGNORE__') {
    return fn
  }
  return node => {
    const [root] = context.getAncestors()
    const [importDeclarations] = sift(root?.body ?? [], {
      type: 'ImportDeclaration',
      source: { value: importDeclarationSetting }
    })
    if (importDeclarations.length) {
      const [importDeclaration] = importDeclarations
      const allSpecifiers = ['__IGNORE__'].concat(
        extractSpecifiersFromImportDeclaration(importDeclaration)
      )
      const importSpecifierSetting = getImportSpecifier(context)
      return allSpecifiers.includes(importSpecifierSetting)
        ? fn(node)
        : undefined
    }
  }
}

const extractSpecifiersFromImportDeclaration = importDeclaration => {
  const [specifiers] = sift(
    importDeclaration?.specifiers ?? [],
    anyOf(
      {
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: pluck(isString) }
      },
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: pluck(isString) }
      }
    )
  )
  return specifiers
}

function StringFromArguments(context) {
  return node => node.arguments.map(x => context.getSource(x)).join(', ')
}

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

function makeOperatorGuard(operatorList) {
  return context =>
    allOf(not(anyOf(getIgnoredOps(context))), anyOf(operatorList))
}

module.exports = {
  IdentifierIsAlreadyBigNumberMethod,
  makeIdentifierMembershipDetector,
  makeGlobalIdentifierFixer,
  withImportDeclaration,
  StringFromArguments,
  cleanArray,
  makeOperatorGuard
}
