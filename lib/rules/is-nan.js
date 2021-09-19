const { against, when } = require('match-iz')
const { getConstruct } = require('../settings')
const { withImportDeclaration, StringFromArguments } = require('../helpers')

function isNaNEntry(context) {
  const SuggestReplacement = node => {
    const original = context.getSource(node)

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const construct = getConstruct(context)
        const A = StringFromArguments(context)(node)

        return fixer.replaceText(node, `${construct}(${A}).isNaN()`)
      }
    })
  }

  return against(
    when({
      type: 'CallExpression',
      callee: {
        type: 'Identifier',
        name: 'isNaN'
      }
    })(SuggestReplacement),

    when({
      type: 'CallExpression',
      callee: {
        type: 'MemberExpression',
        object: { type: 'Identifier', name: 'Number' },
        property: { type: 'Identifier', name: 'isNaN' }
      }
    })(SuggestReplacement)
  )
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: withImportDeclaration(context, isNaNEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace isNaN with BigNumber equivalent',
    fixable: 'code'
  }
}
