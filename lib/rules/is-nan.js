const { getConstruct } = require('../settings')
const { makeGlobalIdentifierFixer } = require('../helpers')

const isNaNEntry = makeGlobalIdentifierFixer({
  isNaN: context => `${getConstruct(context)}.isNaN`
})

//
// Expose
//

module.exports = {
  create: context => ({
    Identifier: isNaNEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace isNaN with BigNumber equivalent',
    fixable: 'code'
  }
}
