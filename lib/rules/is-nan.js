const { getConstruct } = require('../settings')
const {
  makeGlobalIdentifierFixer,
  withImportDeclaration
} = require('../helpers')

const isNaNEntry = makeGlobalIdentifierFixer({
  isNaN: context => `${getConstruct(context)}.isNaN`,
  [`Number.isNaN`]: context => `${getConstruct(context)}.isNaN`
})

//
// Expose
//

module.exports = {
  create: context => ({
    Identifier: withImportDeclaration(context, isNaNEntry(context))
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace isNaN with BigNumber equivalent',
    fixable: 'code'
  }
}
