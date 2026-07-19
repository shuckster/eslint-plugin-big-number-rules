const rules = {
  arithmetic: require('./rules/arithmetic'),
  assignment: require('./rules/assignment'),
  bitwise: require('./rules/bitwise'),
  comparison: require('./rules/comparison'),
  isNaN: require('./rules/is-nan'),
  math: require('./rules/math'),
  number: require('./rules/number'),
  parseFloat: require('./rules/parse-float'),
  rounding: require('./rules/rounding')
}

const recommendedRuleEntries = Object.fromEntries(
  Object.keys(rules).map(name => [`big-number-rules/${name}`, 'warn'])
)

const plugin = {
  meta: {
    name: 'eslint-plugin-big-number-rules',
    version: require('../package.json').version
  },
  rules,
  // eslintrc (ESLint 8 and legacy configs) — consumers still declare the plugin
  configs: {
    recommended: {
      rules: { ...recommendedRuleEntries }
    }
  }
}

// Flat config (ESLint 9+) — assign after plugin exists so `plugins` can self-reference
Object.assign(plugin.configs, {
  'flat/recommended': {
    name: 'big-number-rules/flat/recommended',
    plugins: {
      'big-number-rules': plugin
    },
    rules: { ...recommendedRuleEntries }
  }
})

module.exports = plugin
