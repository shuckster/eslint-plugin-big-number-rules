/**
 * Plugin load / surface smoke tests.
 *
 * Catches packaging or dual-package hazards early when upgrading eslint,
 * match-iz, sift-r, or changing exports — without needing full RuleTester runs.
 */

const assert = require('assert')
const path = require('path')
const fs = require('fs')

const EXPECTED_RULES = [
  'arithmetic',
  'assignment',
  'bitwise',
  'comparison',
  'isNaN',
  'math',
  'number',
  'parseFloat',
  'rounding'
]

function runPluginSmokeTests() {
  const plugin = require('../../lib')

  assert.ok(plugin.rules, 'plugin exports rules')
  assert.deepStrictEqual(
    Object.keys(plugin.rules).sort(),
    EXPECTED_RULES.slice().sort(),
    'plugin.rules keys match the expected rule set'
  )

  for (const name of EXPECTED_RULES) {
    const rule = plugin.rules[name]
    assert.equal(typeof rule.create, 'function', `${name}.create is a function`)
    assert.ok(rule.meta, `${name}.meta is present`)
    assert.ok(rule.meta.description, `${name}.meta.description is present`)
  }

  assert.ok(plugin.configs?.recommended, 'configs.recommended is present')
  assert.ok(
    plugin.configs?.['flat/recommended'],
    'configs["flat/recommended"] is present for ESLint 9+'
  )
  assert.ok(plugin.meta?.name, 'plugin.meta.name is present')

  const recommendedRuleIds = Object.keys(plugin.configs.recommended.rules || {})
  const flatRecommendedRuleIds = Object.keys(
    plugin.configs['flat/recommended'].rules || {}
  )
  for (const name of EXPECTED_RULES) {
    const id = `big-number-rules/${name}`
    assert.ok(
      recommendedRuleIds.includes(id),
      `recommended config enables ${id}`
    )
    assert.ok(
      flatRecommendedRuleIds.includes(id),
      `flat/recommended config enables ${id}`
    )
  }

  assert.strictEqual(
    plugin.configs['flat/recommended'].plugins?.['big-number-rules'],
    plugin,
    'flat/recommended plugins self-reference the plugin object'
  )

  // Runtime deps must resolve (guards dual package / exports map breakage)
  const matchIz = require('match-iz')
  const siftR = require('sift-r')
  for (const api of ['match', 'when', 'against', 'otherwise', 'anyOf', 'not']) {
    assert.equal(typeof matchIz[api], 'function', `match-iz.${api} is a function`)
  }
  assert.equal(typeof siftR.sift, 'function', 'sift-r.sift is a function')

  // Every rule file under lib/rules must load without throwing
  const rulesDir = path.join(__dirname, '../../lib/rules')
  const ruleFiles = fs
    .readdirSync(rulesDir)
    .filter(f => f.endsWith('.js'))
  for (const file of ruleFiles) {
    const loaded = require(path.join(rulesDir, file))
    assert.equal(
      typeof loaded.create,
      'function',
      `lib/rules/${file} exports create`
    )
  }

  console.log('plugin-smoke: ok')
}

module.exports = { runPluginSmokeTests, EXPECTED_RULES }
