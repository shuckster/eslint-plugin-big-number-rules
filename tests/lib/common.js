const glob = require('glob')
const fs = require('fs')
const path = require('path')

const configsPath = path.resolve(__dirname, '../../eslintrc-for-other-libs')
const baseEslintSettings = {
  parserOptions: {
    ecmaVersion: 11
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
  globConfigForOtherLibs,
  getExampleEslintConfigsForOtherLibs,
  loadJsonFile,
  expectingErrors,
  bigNumberRules,
  memberExpression,
  makePromise,
  filter,
  map
}

function bigNumberRules(eslintSettings) {
  return eslintSettings?.settings?.['big-number-rules'] ?? {}
}

function memberExpression(config, setting, fn, arg) {
  const { construct: BigNumber } = config
  const method = config[setting][fn]

  if (!Array.isArray(method)) {
    return `${BigNumber}.${method}(${arg});`
  }

  if (method.length === 1) {
    return (
      method[0].replace('__CONSTRUCT__', BigNumber).replace('${A}', arg) + ';'
    )
  }

  if (method.length === 2) {
    const _method = method[0]
    const _arg = method[1].replace('${A}', arg)
    return `${BigNumber}.${_method}(${_arg});`
  }

  return '[INVALID_MEMBER_EXPRESSION_FORMAT]'
}

function expectingErrors(numberOfErrors) {
  return Array(numberOfErrors)
    .fill()
    .map(() => ({
      message: /is '[^']+' a financial calculation\?/
    }))
}

function globConfigForOtherLibs() {
  const [promise, resolve, reject] = makePromise()
  glob(path.join(configsPath, '/**/*.json'), {}, (err, files) => {
    return err
      ? reject(err)
      : Promise.all(files.map(fileOnly)).then(resolve, reject)
  })

  return promise
}

function getExampleEslintConfigsForOtherLibs() {
  return globConfigForOtherLibs().then(files =>
    Promise.all(files.map(loadJsonFile))
  )
}

//
// Helpers
//

function makePromise() {
  let _resolve
  let _reject
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve
    _reject = reject
  })
  return [promise, _resolve, _reject]
}

function fileOnly(potentialFile) {
  const [promise, resolve, reject] = makePromise()

  fs.stat(potentialFile, (err, stats) => {
    const invalid = err || !stats.isFile()
    return invalid ? reject(err || stats) : resolve(potentialFile)
  })

  return promise
}

function loadJsonFile(fileName) {
  if (!fileName) {
    return Promise.reject(new Error('No fileName specified'))
  }

  const [promise, resolve, reject] = makePromise()
  const fullPath = [fileName].flat()

  fs.readFile(path.join(...fullPath), (err, data) =>
    err ? reject(err) : resolve(JSON.parse(data.toString()))
  )

  return promise
}

function filter(pred) {
  return arr => arr.filter(pred)
}

function map(pred) {
  return arr => arr.map(pred)
}
