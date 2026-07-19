const fs = require('fs')
const path = require('path')

const { match, when, otherwise, not, isArray } = require('match-iz')

const configsPath = path.resolve(__dirname, '../../eslintrc-for-other-libs')
const baseEslintSettings = {
  parserOptions: {
    ecmaVersion: 11,
    sourceType: 'module' // For testing withImportDeclaration()
  },
  env: {
    node: true,
    browser: true,
    es6: true
  },
  extends: ['eslint:recommended']
}

module.exports = {
  configsPath,
  baseEslintSettings,
  listConfigJsonFiles,
  getExampleEslintConfigsForOtherLibs,
  loadJsonFile,
  expectingErrors,
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

function expectingErrors(numberOfErrors) {
  return Array(numberOfErrors)
    .fill()
    .map(() => ({
      message: /is '[^']+' a financial calculation\?/
    }))
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
