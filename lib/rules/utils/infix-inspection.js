const { not, allOf } = require('match-iz')
const { inScopeValueOfIdentifierOrLiteral } = require('./parse-literals')

const isWorkable = context =>
  allOf(
    // Bail early if either side is definitely NaN.
    // Avoids stuff that's obviously string concatenation,
    // but won't catch everything
    canPotentiallyInterpretNodeAsANumber(context),

    // Bail if it looks like we're working with ".length".
    // Very unlikely to be a financial calculation!
    not(isALengthMemberExpression)
  )

function canPotentiallyInterpretNodeAsANumber(context) {
  const valueOf = inScopeValueOfIdentifierOrLiteral(context)
  return node => {
    try {
      const value = valueOf(node)
      return !isNaN(value)
    } catch (_) {
      // valueOf threw, so we can't guarantee that it's not a number.
      return true
    }
  }
}

function isALengthMemberExpression(node) {
  return (
    node?.type === 'MemberExpression' &&
    node?.property?.type === 'Identifier' &&
    node?.property?.name === 'length'
  )
}

//
// Expose
//

module.exports = {
  canPotentiallyInterpretNodeAsANumber,
  isALengthMemberExpression,
  isWorkable
}
