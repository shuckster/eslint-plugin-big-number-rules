const { allOf, not, anyOf } = require('match-iz')
const { getIgnoredOps } = require('../../settings')

function makeOperatorGuard(operatorList) {
  return context =>
    allOf(not(anyOf(getIgnoredOps(context))), anyOf(operatorList))
}

module.exports = {
  makeOperatorGuard
}
