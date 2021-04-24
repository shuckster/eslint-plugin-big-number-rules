const { makeSettingGetter, getConstruct } = require('../settings')

//
// Number.prototype replacements
//

const numberMethods = {
  toFixed: 'decimalPlaces',
  parseFloat: '__CONSTRUCT__'
}

const getNumberMethods = makeSettingGetter('number', numberMethods)

function numberEntry(context) {
  const numberMethods = getNumberMethods(context)
  const supportedNumberMethods = Object.keys(numberMethods)

  function bigNumberNumberReplacement(context, node, name) {
    const method = numberMethods[name]
    const args = node.arguments.map(arg => context.getSource(arg)).join(', ')
    const construct = getConstruct(context)

    // <SPECIAL_CASE>
    if (method === '__CONSTRUCT__' && node?.callee?.object?.name === 'Number') {
      return `${construct}(${args})`
    }

    const obj = context.getSource(node?.callee?.object)
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

    const original = context.getSource(node)
    context.report({
      node,
      message: `is '${original}' a financial calculation??`,
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
    CallExpression: numberEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Replace JavaScript Number.prototype methods with BigNumber equivalents',
    fixable: 'code'
  }
}
