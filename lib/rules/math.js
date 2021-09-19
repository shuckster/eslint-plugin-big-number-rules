const { match, when, against, otherwise } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const { withImportDeclaration, StringFromArguments } = require('../helpers')

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
  const isSupportedMathMethod = Object.keys(mathMethods)

  const SuggestReplacement = node => {
    const original = context.getSource(node)

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const construct = getConstruct(context)
        const propertyName = node.callee.property.name
        const A = StringFromArguments(context)(node)

        return fixer.replaceText(
          node,
          match(mathMethods[propertyName])(
            when({ length: 1 })(method =>
              method[0].replace('__CONSTRUCT__', construct).replace('${A}', A)
            ),

            when({ length: 2 })(method => {
              const _method = method[0]
              const _args = method.slice(1).map(arg => arg.replace('${A}', A))
              return `${construct}.${_method}(${_args})`
            }),

            otherwise(method => `${construct}.${method}(${A})`)
          )
        )
      }
    })
  }

  return against(
    when({
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { name: 'Math' },
        property: { name: isSupportedMathMethod }
      }
    })(SuggestReplacement)
  )
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
