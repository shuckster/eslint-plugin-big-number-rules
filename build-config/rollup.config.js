//
// Build with Rollup
//

const json = require('@rollup/plugin-json')
const commonjs = require('@rollup/plugin-commonjs')
const cleanup = require('rollup-plugin-cleanup')
const { terser } = require('rollup-plugin-terser')

const pkg = require('../package.json')
const { paths, banner } = require('./common')

const terserConfig = {
  output: {
    ecma: 5,
    comments: (node, comment) => {
      var text = comment.value
      var type = comment.type
      if (type == 'comment2') {
        // multiline comment
        return /License: /.test(text)
      }
    }
  }
}

module.exports = {
  input: paths.SRC,
  output: [
    {
      file: paths.DIST,
      banner: banner(pkg),
      format: 'cjs',
      sourcemap: false,
      plugins: [terser(terserConfig)],
      exports: 'default'
    }
  ],
  plugins: [json(), commonjs(), cleanup()]
}
