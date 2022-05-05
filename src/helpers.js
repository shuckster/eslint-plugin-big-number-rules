const matchiz = require('match-iz')
const { match, against, when, otherwise } = matchiz
const { pluck, isString, anyOf } = matchiz

const {
  getConstruct,
  getImportDeclaration,
  getImportSpecifier
} = require('./settings')

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function Identity(x) {
  return x
}

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

const extractSpecifiersFromImportDeclaration = importDeclaration =>
  (importDeclaration?.specifiers || [])
    .map(
      against(
        when(
          {
            type: anyOf('ImportDefaultSpecifier', 'ImportSpecifier'),
            local: { type: 'Identifier', name: pluck(isString) }
          },
          Identity
        ),
        otherwise(null)
      )
    )
    .filter(isString)

function StringFromArguments(context) {
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

module.exports = {
  IdentifierIsAlreadyBigNumberMethod,
  makeIdentifierMembershipDetector,
  makeGlobalIdentifierFixer,
  withImportDeclaration,
  StringFromArguments
}
