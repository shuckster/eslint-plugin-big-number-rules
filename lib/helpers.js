const { pluck, isString, anyOf } = require('match-iz')
const { sift } = require('sift-r')
const { getImportDeclaration, getImportSpecifier } = require('./settings')

function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
}

function cleanArray(array) {
  return array.filter(x => x !== false && x !== null && x !== undefined)
}

function StringFromArguments(context) {
  return node => node.arguments.map(x => context.getSource(x)).join(', ')
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

//
// Expose
//

module.exports = {
  withImportDeclaration,
  StringFromArguments,
  cleanArray,
  hasOwn
}
