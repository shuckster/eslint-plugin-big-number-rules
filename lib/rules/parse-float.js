const { getConstruct } = require('../settings')
const { makeGlobalIdentifierFixer } = require('../helpers')

const parseFloatEntry = makeGlobalIdentifierFixer({
  parseFloat: context => getConstruct(context)
})

//
// Expose
//

module.exports = {
  create: context => ({
    Identifier: parseFloatEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Replace parseFloat with BigNumber equivalent',
    fixable: 'code'
  }
}
