const { match, when, against, otherwise } = require('match-iz')
const { makeSettingGetter, getConstruct } = require('../settings')
const {
  IdentifierIsAlreadyBigNumberMethod,
  withImportDeclaration,
  StringFromArguments
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
  const isSupportedNumberMethod = Object.keys(numberMethods)

  return against(
    when({
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        property: {
          type: 'Identifier',
          name: isSupportedNumberMethod
        }
      }
    })(SuggestReplacement)
  )

  function SuggestReplacement(node) {
    const { property, object } = node.callee

    if (IdentifierIsAlreadyBigNumberMethod(context, property)) {
      return
    }

    const original = context.getSource(node)

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const construct = getConstruct(context)
        const obj = context.getSource(object)
        const A = StringFromArguments(context)(node)

        return fixer.replaceText(
          node,
          match({ node, method: numberMethods[property.name] })(
            when({
              node: { callee: { object: { name: 'Number' } } },
              method: Array.isArray
            })(({ method }) =>
              method[0]
                .replace('__CONSTRUCT__', construct)
                .replace('${O}', obj)
                .replace('${A}', A)
            ),

            otherwise(({ method }) => `${construct}(${obj}).${method}(${A})`)
          )
        )
      }
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
