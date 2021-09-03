const { match, when, otherwise } = require('match-iz')
const { getConstruct } = require('../settings')
const { withImportDeclaration, nodeArgumentsAsString } = require('../helpers')

function isNaNEntry(context) {
  return node => {
    const A = match(node)(
      when({
        type: 'CallExpression',
        callee: {
          type: 'Identifier',
          name: 'isNaN'
        }
      })(nodeArgumentsAsString(context)),

      when({
        type: 'CallExpression',
        callee: {
          type: 'MemberExpression',
          object: { type: 'Identifier', name: 'Number' },
          property: { type: 'Identifier', name: 'isNaN' }
        }
      })(nodeArgumentsAsString(context)),

      otherwise(null)
    )

    if (A !== null) {
      const original = context.getSource(node)
      context.report({
        node,
        message: `is '${original}' a financial calculation?`,
        fix: fixer =>
          fixer.replaceText(node, `${getConstruct(context)}(${A}).isNaN()`)
      })
    }
  }
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
