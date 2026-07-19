/**
 * Contracts that protect against silent breakage during dependency upgrades.
 *
 * 1. match-iz against()/match() must fall through on non-matches when used as
 *    ESLint visitor handlers — v5 throws without otherwise() (v3 returned
 *    undefined). Circular AST nodes make the throw path extra noisy.
 * 2. Static scan: every against( in lib/ must include otherwise(.
 * 3. Test helper memberExpression() shapes (length 1/2 arrays + string method).
 * 4. helpers.withImportDeclaration + sift-r / pluck still extract import names.
 * 5. ESLint deprecation fingerprints are recorded so eslint major upgrades can
 *    be compared against a known baseline.
 */

const assert = require('assert')
const fs = require('fs')
const path = require('path')
const { spawnSync } = require('child_process')

const { against, when, otherwise, match, not, isArray } = require('match-iz')
const { sift } = require('sift-r')
const { pluck, isString, anyOf } = require('match-iz')

const { memberExpression } = require('./common')
const {
  withImportDeclaration,
  StringFromArguments
} = require('../../lib/helpers')

function runUpgradeContracts() {
  assertAgainstFallsThroughOnCircularAst()
  assertEveryAgainstHasOtherwise()
  assertMemberExpressionHelper()
  assertImportSpecifierSift()
  assertEslintDeprecationBaseline()
  console.log('upgrade-contracts: ok')
}

/**
 * match-iz@5+ throws "Exhausted all patterns" (and JSON.stringifies the input)
 * when against()/match() has no match and no otherwise(). AST nodes are cyclic
 * via .parent, so the throw path becomes "Converting circular structure to JSON".
 * Rules must use otherwise(() => undefined) for visitor fall-through.
 */
function assertAgainstFallsThroughOnCircularAst() {
  const ident = { type: 'Identifier', name: 'x' }
  const call = { type: 'CallExpression', callee: ident, arguments: [] }
  ident.parent = call

  const handler = against(
    when({ type: 'NeverMatches' })(() => 'hit'),
    otherwise(() => undefined)
  )
  assert.strictEqual(
    handler(ident),
    undefined,
    'against + otherwise returns undefined on non-match (circular AST safe)'
  )

  // Without otherwise, non-match must throw (documents v5 contract for maintainers)
  const strictHandler = against(when({ type: 'NeverMatches' })(() => 'hit'))
  assert.throws(
    () => strictHandler({ type: 'Y' }),
    /Exhausted all patterns/,
    'against without otherwise throws on non-match (match-iz v5+)'
  )
}

function assertEveryAgainstHasOtherwise() {
  const libRoot = path.join(__dirname, '../../lib')
  const files = walkJsFiles(libRoot)
  const offenders = []

  for (const file of files) {
    const src = fs.readFileSync(file, 'utf8')
    // Strip block + line comments so documented examples don't false-positive
    const code = src
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/(^|[^:])\/\/.*$/gm, '$1')

    let searchFrom = 0
    let againstIdx = code.indexOf('against(', searchFrom)
    while (againstIdx !== -1) {
      const openParen = againstIdx + 'against'.length
      const closeParen = findMatchingParen(code, openParen)
      if (closeParen === -1) {
        offenders.push(`${rel(file)}: unclosed against(`)
        break
      }

      const callBody = code.slice(openParen, closeParen + 1)
      if (!/\botherwise\s*\(/.test(callBody)) {
        const line = code.slice(0, againstIdx).split('\n').length
        offenders.push(`${rel(file)}:${line}`)
      }
      searchFrom = closeParen + 1
      againstIdx = code.indexOf('against(', searchFrom)
    }
  }

  assert.deepStrictEqual(
    offenders,
    [],
    `every against(...) in lib/ must include otherwise(...) for match-iz v5+ fall-through.\nMissing:\n  ${offenders.join('\n  ')}`
  )
}

function assertMemberExpressionHelper() {
  const config = {
    construct: 'BigNumber',
    arithmetic: {
      '+': 'plus',
      advanced1: ['__CONSTRUCT__(${A}).negated()'],
      advanced2: ['pow', '${A}, 2']
    }
  }

  assert.strictEqual(
    memberExpression(config, 'arithmetic', '+', '1'),
    'BigNumber.plus(1);'
  )
  assert.strictEqual(
    memberExpression(config, 'arithmetic', 'advanced1', 'x'),
    'BigNumber(x).negated();'
  )
  assert.strictEqual(
    memberExpression(config, 'arithmetic', 'advanced2', 'x'),
    'BigNumber.pow(x, 2);'
  )

  // Length-based array patterns (match-iz v5 partial array matching still OK
  // when matching { length: N } object shapes against arrays)
  assert.strictEqual(
    match(['only'])(
      when(not(isArray))(() => 'nope'),
      when({ length: 1 })(m => m[0]),
      when({ length: 2 })(() => 'two'),
      otherwise('fallback')
    ),
    'only'
  )
}

function assertImportSpecifierSift() {
  // Mirrors lib/helpers extractSpecifiersFromImportDeclaration
  const importDeclaration = {
    type: 'ImportDeclaration',
    source: { value: 'bignumber.js' },
    specifiers: [
      {
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: 'BigNumber' }
      },
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: 'BigNumber' },
        local: { type: 'Identifier', name: 'BN' }
      }
    ]
  }

  const [specifiers] = sift(
    importDeclaration.specifiers,
    anyOf(
      {
        type: 'ImportDefaultSpecifier',
        local: { type: 'Identifier', name: pluck(isString) }
      },
      {
        type: 'ImportSpecifier',
        imported: { type: 'Identifier', name: pluck(isString) }
      }
    )
  )

  assert.deepStrictEqual(
    specifiers,
    ['BigNumber', 'BigNumber'],
    'sift + pluck still extracts import local/imported names'
  )

  // withImportDeclaration: ignored when setting is __IGNORE__
  const passthrough = withImportDeclaration(
    { settings: {}, getAncestors: () => [] },
    node => node
  )
  assert.strictEqual(passthrough('keep'), 'keep')

  // StringFromArguments uses context.sourceCode.getText
  const sfa = StringFromArguments({
    sourceCode: { getText: n => n.value }
  })
  assert.strictEqual(
    sfa({ arguments: [{ value: 'a' }, { value: 'b' }] }),
    'a, b'
  )
}

/**
 * Run a single arithmetic RuleTester case and collect unique ESLint
 * DeprecationWarning messages. Snapshot lives under tests/fixtures so future
 * eslint upgrades show a clear diff of which APIs still need migrating.
 */
function assertEslintDeprecationBaseline() {
  const fixturePath = path.join(
    __dirname,
    '../fixtures/eslint-deprecation-baseline.txt'
  )
  const runner = path.join(__dirname, 'collect-deprecations.js')
  const result = spawnSync(process.execPath, [runner], {
    encoding: 'utf8',
    env: process.env
  })

  if (result.status !== 0 && !result.stdout.includes('DEPRECATIONS_BEGIN')) {
    throw new Error(
      `collect-deprecations failed:\n${result.stderr || result.stdout}`
    )
  }

  const stdout = result.stdout || ''
  const begin = stdout.indexOf('DEPRECATIONS_BEGIN\n')
  const end = stdout.indexOf('\nDEPRECATIONS_END')
  assert.ok(begin !== -1 && end !== -1, 'deprecation collector markers present')

  const actual = stdout
    .slice(begin + 'DEPRECATIONS_BEGIN\n'.length, end)
    .split('\n')
    .filter(Boolean)
    .sort()
    .join('\n')

  if (!fs.existsSync(fixturePath)) {
    fs.mkdirSync(path.dirname(fixturePath), { recursive: true })
    fs.writeFileSync(fixturePath, actual + (actual ? '\n' : ''), 'utf8')
    console.log(
      `upgrade-contracts: wrote new deprecation baseline (${actual.split('\n').filter(Boolean).length} warnings)`
    )
    return
  }

  const expected = fs
    .readFileSync(fixturePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .sort()
    .join('\n')

  assert.strictEqual(
    actual,
    expected,
    [
      'ESLint deprecation warning set changed.',
      'If this is intentional (e.g. you migrated context.getSource → sourceCode.getText),',
      `update tests/fixtures/eslint-deprecation-baseline.txt.`,
      '',
      '--- expected ---',
      expected || '(none)',
      '--- actual ---',
      actual || '(none)'
    ].join('\n')
  )
}

//
// helpers
//

function walkJsFiles(dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...walkJsFiles(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

function findMatchingParen(code, openIdx) {
  // openIdx points at '('
  let depth = 0
  let inStr = null
  let escaped = false
  for (let i = openIdx; i < code.length; i++) {
    const ch = code[i]
    if (inStr) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === inStr) inStr = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inStr = ch
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function rel(file) {
  return path.relative(path.join(__dirname, '../..'), file)
}

module.exports = { runUpgradeContracts }
