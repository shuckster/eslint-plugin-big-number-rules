const path = require('path')

const paths = {
  SRC: path.resolve('./lib/index.js'),
  DIST: path.join('./dist/index.js')
}

function banner(pkg, build = '') {
  return `
/*
 * eslint-plugin-big-number-rules
 * v${pkg.version}
 * ${pkg.homepage}
 * License: ${pkg.license}
 */
${build}`
}

module.exports = {
  paths,
  banner
}
