module.exports = {
  rules: {
    arithmetic: require('./rules/arithmetic'),
    assignment: require('./rules/assignment'),
    isNaN: require('./rules/is-nan'),
    math: require('./rules/math'),
    number: require('./rules/number'),
    parseFloat: require('./rules/parse-float'),
    rounding: require('./rules/rounding')
  },
  configs: {
    recommended: {
      rules: {
        'big-number-rules/arithmetic': 'warn',
        'big-number-rules/assignment': 'warn',
        'big-number-rules/isNaN': 'warn',
        'big-number-rules/math': 'warn',
        'big-number-rules/number': 'warn',
        'big-number-rules/parseFloat': 'warn',
        'big-number-rules/rounding': 'warn'
      }
    }
  }
}
