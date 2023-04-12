const { hasOwn } = require('../../helpers.js')

function inScopeValueOfIdentifierOrLiteral(context) {
  function checkNode(node) {
    switch (node.type) {
      case 'Literal':
        return node.value

      case 'Identifier': {
        const scope = context.getScope()
        const variable = scope.variables.find(v => v.name === node.name)

        if (variable) {
          const definition = variable.defs[0]

          // Check if the variable is initialized with a value.
          if (definition?.type === 'Variable' && definition.node.init) {
            return checkNode(definition.node.init)
          }
        }
        throw new Error(`Unable to resolve value for identifier: ${node.name}`)
      }

      case 'BinaryExpression':
        if (node.operator === '+') {
          const leftValue = checkNode(node.left)
          const rightValue = checkNode(node.right)
          return leftValue + rightValue
        }
        throw new Error(
          `Unable to resolve value for binary expression: ${node.operator}`
        )

      case 'MemberExpression': {
        const objectValue = checkNode(node.object)

        if (typeof objectValue === 'object' || Array.isArray(objectValue)) {
          const propertyValue = node.computed
            ? checkNode(node.property)
            : node.property.name

          // Return the corresponding property value if it exists
          if (hasOwn(objectValue, propertyValue)) {
            return objectValue[propertyValue]
          }
        }
        throw new Error(
          `Unable to resolve value for member expression: ${node.property.name}`
        )
      }

      case 'ObjectExpression': {
        const obj = {}
        for (const prop of node.properties) {
          if (prop.type === 'Property') {
            const key =
              prop.key.type === 'Identifier'
                ? prop.key.name
                : checkNode(prop.key)

            try {
              obj[key] = checkNode(prop.value)
            } catch (error) {
              obj[key] = undefined
            }
          }
        }
        return obj
      }

      case 'ArrayExpression': {
        const arr = []
        for (const element of node.elements) {
          try {
            arr.push(checkNode(element))
          } catch (error) {
            arr.push(undefined)
          }
        }
        return arr
      }

      case 'TemplateLiteral': {
        let result = ''
        for (let i = 0; i < node.quasis.length; i++) {
          const quasi = node.quasis[i]
          result += quasi.value.cooked

          if (i < node.expressions.length) {
            const expr = node.expressions[i]
            result += checkNode(expr)
          }
        }
        return result
      }

      default:
        throw new Error(`Unable to resolve value for node type: ${node.type}`)
    }
  }

  return checkNode
}

//
// Expose
//

module.exports = {
  inScopeValueOfIdentifierOrLiteral
}
