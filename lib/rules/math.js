const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')

//
// Math.lib() replacements
//

const mathMethods = {
  min: 'minimum',
  max: 'maximum',
  random: 'random',
  abs: 'absoluteValue',
  sign: ['__CONSTRUCT__(${A}).comparedTo(0)'],
  sqrt: 'squareRoot'
}

const getMathMethods = makeSettingGetter('math', mathMethods)

function mathEntry(context) {
  const mathMethods = getMathMethods(context)
  const supportedMathMethods = Object.keys(mathMethods)

  function bigNumberMathReplacement(context, node, name) {
    const method = mathMethods[name]
    const args = node.arguments.map(arg => context.getSource(arg)).join(', ')
    const construct = getConstruct(context)

    if (Array.isArray(method)) {
      if (method.length === 1) {
        return method[0]
          .replace('__CONSTRUCT__', construct)
          .replace('${A}', args)
      }

      if (method.length === 2) {
        const _method = method[0]
        const _args = method.slice(1).map(arg => arg.replace('${A}', args))
        return `${construct}.${_method}(${_args})`
      }
    }

    return `${construct}.${method}(${args})`
  }

  return node => {
    const { callee } = node
    if (callee.type !== 'MemberExpression') {
      return
    }
    if (callee?.object?.name !== 'Math') {
      return
    }

    const propertyName = callee?.property?.name
    if (!supportedMathMethods.includes(propertyName)) {
      return
    }

    const original = context.getSource(node)
    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer =>
        fixer.replaceText(
          node,
          bigNumberMathReplacement(context, node, propertyName)
        )
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: withImportDeclaration(context, mathEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace JavaScript Math methods with BigNumber equivalents',
    fixable: 'code'
  }
}
