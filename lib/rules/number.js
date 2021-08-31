const { makeSettingGetter, getConstruct } = require('../settings')
const {
  IdentifierIsAlreadyBigNumberMethod,
  withImportDeclaration
} = require('../helpers')

//
// Number.prototype replacements
//

const numberMethods = {
  parseFloat: ['__CONSTRUCT__(${A})'],
  toExponential: 'toExponential',
  toFixed: 'decimalPlaces',
  toPrecision: 'toPrecision',
  toString: 'toString'
}

const getNumberMethods = makeSettingGetter('number', numberMethods)

function numberEntry(context) {
  const numberMethods = getNumberMethods(context)
  const supportedNumberMethods = Object.keys(numberMethods)

  function bigNumberNumberReplacement(context, node, name) {
    const method = numberMethods[name]
    const args = node.arguments.map(arg => context.getSource(arg)).join(', ')
    const construct = getConstruct(context)
    const obj = context.getSource(node?.callee?.object)

    if (
      node?.callee?.object?.name === 'Number' &&
      Array.isArray(method) &&
      method.length === 1
    ) {
      return method[0]
        .replace('__CONSTRUCT__', construct)
        .replace('${O}', obj)
        .replace('${A}', args)
    }

    return `${construct}(${obj}).${method}(${args})`
  }

  return node => {
    const { callee } = node
    if (callee.type !== 'MemberExpression') {
      return
    }
    if (callee?.property?.type !== 'Identifier') {
      return
    }

    const propertyName = callee?.property?.name
    if (!supportedNumberMethods.includes(propertyName)) {
      return
    }

    if (IdentifierIsAlreadyBigNumberMethod(context, callee?.property)) {
      return
    }

    const original = context.getSource(node)
    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer =>
        fixer.replaceText(
          node,
          bigNumberNumberReplacement(context, node, propertyName)
        )
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: withImportDeclaration(context, numberEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Replace JavaScript Number.prototype methods with BigNumber equivalents',
    fixable: 'code'
  }
}
