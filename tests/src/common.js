const fs = require('fs')
const path = require('path')

const { match, when, otherwise, not, isArray } = require('match-iz')

const configsPath = path.resolve(__dirname, '../../eslintrc-for-other-libs')

/** Flat RuleTester defaults (ESLint 9+). languageOptions replaces parserOptions/env. */
const baseEslintSettings = {
  languageOptions: {
    ecmaVersion: 11,
    sourceType: 'module' // For testing withImportDeclaration()
  }
}

/**
 * Normalize eslintrc-shaped configs (fixtures under eslintrc-for-other-libs)
 * and flat configs into a RuleTester constructor config for ESLint 9+.
 * Strips plugins/extends/env/rules which RuleTester does not use when rules
 * are passed directly to .run().
 */
function toRuleTesterConfig(config = {}) {
  const parserOptions = config.parserOptions || {}
  const languageOptions = {
    ecmaVersion: 11,
    sourceType: 'module',
    ...config.languageOptions,
    ...(parserOptions.ecmaVersion != null
      ? { ecmaVersion: parserOptions.ecmaVersion }
      : {}),
    ...(parserOptions.sourceType != null
      ? { sourceType: parserOptions.sourceType }
      : {})
  }

  const out = { languageOptions }
  if (config.settings) {
    out.settings = config.settings
  }
  return out
}

module.exports = {
  configsPath,
  baseEslintSettings,
  toRuleTesterConfig,
  listConfigJsonFiles,
  getExampleEslintConfigsForOtherLibs,
  loadJsonFile,
  expectingErrors,
  errorWithSuggestions,
  uniqueValidTests,
  bigNumberRules,
  memberExpression,
  filter,
  map,
  flow,
  tryCatch
}

function bigNumberRules(eslintSettings) {
  return eslintSettings?.settings?.['big-number-rules'] ?? {}
}

function memberExpression(config, setting, fn, arg) {
  const { construct: BigNumber } = config

  return match(config[setting][fn])(
    when(not(isArray))(method => `${BigNumber}.${method}(${arg});`),
    when({ length: 1 })(method =>
      method[0]
        .replace('__CONSTRUCT__', BigNumber)
        .replace('${A}', arg)
        .concat(';')
    ),
    when({ length: 2 })($ => {
      const _method = $[0]
      const _arg = $[1].replace('${A}', arg)
      return `${BigNumber}.${_method}(${_arg});`
    }),
    otherwise('[INVALID_MEMBER_EXPRESSION_FORMAT]')
  )
}

const financialMessage = /is '[^']+' a financial calculation\?/

function expectingErrors(numberOfErrors) {
  return Array(numberOfErrors)
    .fill()
    .map(() => ({
      message: financialMessage
    }))
}

/** ESLint 9+ RuleTester requires message/messageId on every error object. */
function errorWithSuggestions(suggestions) {
  return {
    message: financialMessage,
    suggestions
  }
}

/**
 * Dedupe valid cases for ESLint 9+ RuleTester (rejects identical codes).
 * Fix-outputs used as "still valid" fixtures often collide (e.g. >> vs >>>).
 */
function uniqueValidTests(validTests = []) {
  const seen = new Set()
  const out = []
  for (const item of validTests) {
    const key = typeof item === 'string' ? item : item?.code
    if (key == null || seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

//
// Files
//

function getExampleEslintConfigsForOtherLibs() {
  return listConfigJsonFiles()
    .then(files => files.filter($ => !$.endsWith(`${path.sep}default.json`)))
    .then($ => $.map(loadJsonFile))
    .then($ => Promise.all($))
}

/** List *.json files under eslintrc-for-other-libs (no glob dependency). */
function listConfigJsonFiles() {
  return fs.promises
    .readdir(configsPath, { withFileTypes: true })
    .then(entries =>
      entries
        .filter(e => e.isFile() && e.name.endsWith('.json'))
        .map(e => path.join(configsPath, e.name))
    )
}

function loadJsonFile(fileName) {
  return Promise.resolve(fileName)
    .then(ThrowIfUnset('No fileName specified'))
    .then(fileName => [fileName].flat())
    .then($ => path.join(...$))
    .then($ => fs.readFileSync($))
    .then($ => $.toString())
    .then(JSON.parse)
}

//
// Helpers
//

function ThrowIfUnset(message) {
  return x => {
    if (!x) throw new Error(message)
    return x
  }
}

function filter(pred) {
  return arr => arr.filter(pred)
}

function map(pred) {
  return arr => arr.map(pred)
}

function flow(...fns) {
  return (...x) => fns.reduce((g, f) => [f(...g)], x)[0]
}

function tryCatch(f) {
  let result, reason
  try {
    result = f()
  } catch (e) {
    reason = e
  }
  return {
    fold: (left, right) => (reason ? left(reason) : right(result))
  }
}
