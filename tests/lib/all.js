const path = require('path')
const RuleTester = require('eslint').RuleTester

const {
  baseEslintSettings,
  configsPath,
  getExampleEslintConfigsForOtherLibs,
  loadJsonFile,
  bigNumberRules,
  makePromise,
  filter,
  map
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
    .then(defaultEslintSettings =>
      testAllSuitesAgainstEslintConfig(defaultEslintSettings)
        .then(logWhenDoneWith())
        .then(runTestSuitesAgainstCustomEslintConfigs)
    )
    .finally(() => {
      console.log(new Date().toTimeString())
      process.exit(errorCode)
    })
}

function testAllSuitesAgainstEslintConfig(customEslintSettings) {
  return Promise.allSettled(
    suites.map(({ makeTest }) => {
      const [promise, resolve, reject] = makePromise()

      const eslintSettings = {
        ...baseEslintSettings,
        ...customEslintSettings
      }

      const config = bigNumberRules(eslintSettings)
      const { name, rule, invalidTests, validTests } = makeTest(config)
      const ruleTester = new RuleTester(eslintSettings)

      try {
        ruleTester.run(name, rule, {
          valid: validTests,
          invalid: invalidTests
        })
        resolve()
      } catch (e) {
        reject(
          `${e}\n\\_ ${config.construct} // ${name}\nrule: ${JSON.stringify(
            rule,
            null,
            2
          )}\n`
        )
      }

      return promise
    })
  )
    .then(filter(result => result.status === 'rejected'))
    .then(map(result => result.reason))
    .then(errors => {
      if (errors.length) {
        errorCode = 1
      }
      errors.forEach(error => console.error(error))
    })
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
