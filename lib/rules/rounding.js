const { makeSettingGetter } = require('../settings')

//
// Math.floor() recommendations
//

const precisionConstants = {
  floor: 'ROUND_FLOOR',
  ceil: 'ROUND_CEIL',
  round: 'ROUND_HALF_UP'
}

const getPrecisionConstants = makeSettingGetter('rounding', precisionConstants)

function mathPrecisionEntry(context) {
  const supportedConstants = Object.keys(precisionConstants)

  return node => {
    const { callee } = node
    if (callee.type !== 'MemberExpression') {
      return
    }
    if (callee?.object?.name !== 'Math') {
      return
    }

    const propertyName = callee?.property?.name
    if (!supportedConstants.includes(propertyName)) {
      return
    }

    const original = context.getSource(node)
    context.report({
      node,
      message:
        `is '${original}' a financial calculation? ` +
        `If so, use the global constructor setting:\n\n` +
        `BigNumber.set({
  ROUNDING_MODE: BigNumber.${getPrecisionConstants(context)[propertyName]}
})}\n`
    })
  }
}

//
// Expose
//

module.exports = {
  create: context => ({
    CallExpression: mathPrecisionEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description: 'Warn against using JavaScript Math.round|ceil|floor methods'
  }
}
