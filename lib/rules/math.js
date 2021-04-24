const { makeSettingGetter, getConstruct } = require('../settings')

//
// Math.lib() replacements
//

const mathMethods = {
  min: 'minimum',
  max: 'maximum',
  random: 'random',
  abs: 'absoluteValue',
  sign: 'comparedTo',
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
    return `${construct}.${method}(${args})`
  }

  function bigNumberSignReplacement(context, node) {
    const method = mathMethods['sign']
    const args = node.arguments.map(arg => context.getSource(arg)).join(', ')
    const construct = getConstruct(context)
    return `${construct}(${args}).${method}(0)`
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
      message: `is '${original}' a financial calculation??`,
      fix: fixer =>
        fixer.replaceText(
          node,
          propertyName === 'sign'
            ? bigNumberSignReplacement(context, node)
            : bigNumberMathReplacement(context, node, propertyName)
        )
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: mathEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace JavaScript Math methods with BigNumber equivalents',
    fixable: 'code'
  }
}
