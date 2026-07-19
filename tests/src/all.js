const path = require('path')
const RuleTester = require('eslint').RuleTester

const {
  baseEslintSettings,
  configsPath,
  getExampleEslintConfigsForOtherLibs,
  loadJsonFile,
  bigNumberRules,
  filter,
  map,
  flow,
  tryCatch
} = require('./common')

const suites = [
  require('./arithmetic'),
  require('./assignment'),
  require('./bitwise'),
  require('./comparison'),
  require('./is-nan'),
  require('./math'),
  require('./number'),
  require('./parse-float'),
  require('./rounding')
]

const { makeTests: makeIgnoreOperatorsTests } = require('./ignore-operators')
const { runPluginSmokeTests } = require('./plugin-smoke')
const { runUpgradeContracts } = require('./upgrade-contracts')

let errorCode = 0

function main() {
  Promise.resolve()
    .then(runPluginSmokeTests)
    .then(runUpgradeContracts)
    .then(() => loadJsonFile(path.join(configsPath, 'default.json')))
    .then(testAllSuitesAgainstEslintConfig)
    .then(logWhenDoneWith())
    .then(runTestSuitesAgainstCustomEslintConfigs)
    .then(runIgnoreOperatorsTests)
    .then(logWhenDoneWith({ settings: { 'big-number-rules': { construct: 'BigNumber (unsafelyIgnoreSuggestionsForOperators)' } } }))
    .catch(err => {
      errorCode = 1
      console.error(err)
    })
    .finally(() => {
      console.log(new Date().toTimeString())
      process.exit(errorCode)
    })
}

function testAllSuitesAgainstEslintConfig(customEslintSettings) {
  const eslintSettings = {
    ...baseEslintSettings,
    ...customEslintSettings
  }
  const ruleTester = new RuleTester(eslintSettings)
  const config = bigNumberRules(eslintSettings)
  const suitesOpts = suites
    .map(({ makeTest }) => makeTest(config))
    .map(({ invalidTests: invalid, validTests: valid, ...rest }) => ({
      testCases: { valid, invalid },
      ...rest
    }))

  const ruleTestersToRun = suitesOpts.map(opts =>
    runRuleTester({ ruleTester, config, ...opts })
  )
  return Promise.allSettled(ruleTestersToRun)
    .then(filter(result => result.status === 'rejected'))
    .then(map(result => result.reason))
    .then(errors => {
      if (errors.length) {
        errorCode = 1
      }
      errors.forEach(console.error)
    })
}

function runRuleTester({ ruleTester, config, name, rule, testCases }) {
  return new Promise((resolve, reject) =>
    tryCatch(() => ruleTester.run(name, rule, testCases)).fold(
      flow(
        error => [error, config.construct, name, JSON.stringify(rule, null, 2)],
        ([$1, $2, $3, $4]) => `${$1}\n\\_ ${$2} // ${$3}\nrule: ${$4}\n`,
        reject
      ),
      resolve
    )
  )
}

function runTestSuitesAgainstCustomEslintConfigs() {
  return getExampleEslintConfigsForOtherLibs().then(runTestsAgainstAll)

  function runTestsAgainstAll(configs) {
    return Promise.all(configs.map(runTestsAgainstThis))
  }

  function runTestsAgainstThis(config) {
    return testAllSuitesAgainstEslintConfig(config).finally(
      logWhenDoneWith(config)
    )
  }
}

function runIgnoreOperatorsTests() {
  const tests = makeIgnoreOperatorsTests()
  const ruleTestersToRun = tests.map(({ name, rule, eslintSettings, testCases }) => {
    const ruleTester = new RuleTester(eslintSettings)
    const config = { construct: 'BigNumber' }
    return runRuleTester({ ruleTester, config, name, rule, testCases })
  })
  return Promise.allSettled(ruleTestersToRun)
    .then(filter(result => result.status === 'rejected'))
    .then(map(result => result.reason))
    .then(errors => {
      if (errors.length) {
        errorCode = 1
      }
      errors.forEach(console.error)
    })
}

function logWhenDoneWith(config) {
  const { construct = 'DEFAULT' } = config?.settings['big-number-rules'] || {}
  const message = `Tests finished using: ${construct}`
  return () => console.log(message)
}

main()
