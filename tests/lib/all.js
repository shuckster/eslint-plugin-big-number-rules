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
  require('./is-nan'),
  require('./math'),
  require('./number'),
  require('./parse-float'),
  require('./rounding')
]

let errorCode = 0

function main() {
  loadJsonFile(path.join(configsPath, 'default.json'))
    .then(defaultSettings => testAllSuitesAgainstEslintConfig(defaultSettings))
    .then(logWhenDoneWith())
    .then(runTestSuitesAgainstCustomEslintConfigs)
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
  const rulesToRun = suites
    .map(({ makeTest }) => makeTest(config))
    .map(({ invalidTests: invalid, validTests: valid, ...rest }) => ({
      testCases: { valid, invalid },
      ...rest
    }))
    .map(opts => runRuleTester({ ruleTester, config, ...opts }))

  return Promise.allSettled(rulesToRun)
    .then(filter(result => result.status === 'rejected'))
    .then(map(result => result.reason))
    .then(errors => {
      if (errors.length) {
        errorCode = 1
      }
      errors.forEach(error => console.error(error))
    })
}

function runRuleTester({ ruleTester, config, name, rule, testCases }) {
  return new Promise((resolve, reject) =>
    tryCatch(() => ruleTester.run(name, rule, testCases)).fork(
      flow(
        e => [e, config.construct, name, JSON.stringify(rule, null, 2)],
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

function logWhenDoneWith(config) {
  const { construct = 'DEFAULT' } = config?.settings['big-number-rules'] || {}
  const message = `Tests finished using: ${construct}`
  return () => console.log(message)
}

main()
