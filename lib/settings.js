const { isPojo } = require('match-iz')

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

//
// Common settings
//

const getConstruct = makeSettingGetter('construct', 'BigNumber')
const getImportDeclaration = makeSettingGetter(
  'importDeclaration',
  '__IGNORE__'
)
const getImportSpecifier = makeSettingGetter('importSpecifier', '__IGNORE__')
const getIgnoredOps = makeSettingGetter(
  'unsafelyIgnoreSuggestionsForOperators',
  []
)
const getSumMethod = makeSettingGetter('sum', 'sum')

//
// Expose
//

module.exports = {
  makeSettingGetter,
  getConstruct,
  getImportDeclaration,
  getImportSpecifier,
  getIgnoredOps,
  getSumMethod
}
