const { isPojo } = require('./util')

function makeSettingGetter(setting = 'construct', value = 'BigNumber') {
  return context => {
    const { settings } = context

    const override = settings[`big-number-rules`]?.[setting] ?? value
    const output =
      isPojo(value) && isPojo(override) && value !== override
        ? { ...value, ...override }
        : override

    return output
  }
}

const getConstruct = makeSettingGetter('construct', 'BigNumber')

module.exports = {
  makeSettingGetter,
  isPojo,
  getConstruct
}
