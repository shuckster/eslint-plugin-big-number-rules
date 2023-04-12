const { getConstruct } = require('../settings')
const { withImportDeclaration } = require('../helpers')
const { makeGlobalIdentifierFixer } = require('./utils/global-identifiers.js')

const parseFloatEntry = makeGlobalIdentifierFixer({
  parseFloat: context => getConstruct(context)
})

//
// Expose
//

module.exports = {
  create: context => ({
    Identifier: withImportDeclaration(context, parseFloatEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace parseFloat with BigNumber equivalent',
    fixable: 'code'
  }
}
