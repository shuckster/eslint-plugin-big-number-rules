const { makeSettingGetter, getConstruct } = require('../settings')

//
// Assignment expressions/methods
//

const arithmeticAssignmentMethods = {
  '+=': 'plus',
  '-=': 'minus',
  '/=': 'dividedBy',
  '*=': 'multipliedBy',
  '**=': 'exponentiatedBy',
  '%=': 'modulo'
}

const bitwiseAssignmentMethods = {
  '>>=': 'shiftedBy',
  '>>>=': 'shiftedBy',
  '<<=': ['${L}', 'shiftedBy', '-${R}']
}

const assignmentMethods = {
  ...arithmeticAssignmentMethods,
  ...bitwiseAssignmentMethods
}

const getAssignmentMethods = makeSettingGetter('assignment', assignmentMethods)
const getSupportsBitwise = makeSettingGetter('supportsBitwise', true)

function assignmentEntry(context) {
  const isBitwiseSupported = getSupportsBitwise(context)

  const assignmentMethods = getAssignmentMethods(context)
  const supportedAssignmentOperators = Object.keys(assignmentMethods)
  const bitwiseAssignmentOperators = Object.keys(bitwiseAssignmentMethods)

  function makeAssignmentExpressionReplacer(method) {
    return (L, R) =>
      method.map(one =>
        one
          .replace('__CONSTRUCT__', getConstruct(context))
          .replace('${L}', L)
          .replace('${R}', R)
      )
  }

  function isCustomAssignmentExpressionReplacer(method) {
    return (
      Array.isArray(method) &&
      method.length === 3 &&
      method.every(one => typeof one === 'string')
    )
  }

  function getAssignmentMethod(L, operator, R) {
    const method = assignmentMethods[operator]
    const K = (L, R) => [L, method, R]
    const fn = isCustomAssignmentExpressionReplacer(method)
      ? makeAssignmentExpressionReplacer(method)
      : K

    return fn(L, R)
  }

  function bigNumberAssignmentExpression(context, L, operator, R) {
    const construct = getConstruct(context)
    const [left, method, right] = getAssignmentMethod(L, operator, R)
    return `${left} = ${construct}(${left}).${method}(${right})`
  }

  return node => {
    const isArithmeticOp = supportedAssignmentOperators.includes(node.operator)
    if (!isArithmeticOp) {
      return
    }

    const isBitwiseOp = bitwiseAssignmentOperators.includes(node.operator)
    const original = context.getSource(node)

    if (isBitwiseOp && !isBitwiseSupported) {
      const construct = getConstruct(context)
      context.report({
        node,
        message:
          `is '${original}' a financial calculation? ` +
          `If so, bitwise methods are not supported by ${construct}\n`
      })

      return
    }

    // Already BigNumber(...).fn()? Bail...
    const construct = getConstruct(context)
    if (node?.left?.type !== 'Identifier' && node?.left?.name === construct) {
      return
    }

    context.report({
      node,
      message: `is '${original}' a financial calculation?`,
      fix: fixer => {
        const { operator, left, right } = node
        const L = context.getSource(left)
        const R = context.getSource(right)

        return fixer.replaceText(
          node,
          bigNumberAssignmentExpression(context, L, operator, R)
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
    AssignmentExpression: assignmentEntry(context)
  }),
  meta: {
    category: 'Financial, Currency',
    description:
      'Replace JavaScript assignment-expressions with BigNumber equivalents',
    fixable: 'code'
  }
}
