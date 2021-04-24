const eslintSettings = {
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

const expectingErrors = numberOfErrors => {
  return Array(numberOfErrors)
    .fill()
    .map(() => ({
      message: /is '[^']+' a financial calculation\?/
    }))
}

module.exports = {
  eslintSettings,
  expectingErrors
}
