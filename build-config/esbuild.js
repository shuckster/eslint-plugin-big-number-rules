//
// Build with esbuild
//

const fs = require('fs')
const esbuild = require('esbuild')
const pkg = require('./package.json')

const { paths, banner } = require('./build-config/common')

function main() {
  buildMain()
}

function buildMain() {
  const buildOptions = {
    entryPoints: [paths.SRC],
    minify: true,
    bundle: true,
    platform: 'node',
    target: ['es6'],
    write: false
  }
  return esbuild
    .build(buildOptions)
    .then(getConcatenatedEsbuildContent)
    .then(buffer => new TextDecoder().decode(buffer))
    .then(text => banner(pkg, text))
    .then(writeTextFile(paths.DIST))
}

main()

//
// Helpers
//

function getConcatenatedEsbuildContent(build) {
  return mergeTypedArrays(
    build.outputFiles.map(out => out.contents),
    Uint8Array
  )
}

// https://stackoverflow.com/a/56993335/127928
const mergeTypedArrays = (arrays, type = Uint8Array) => {
  const result = new type(arrays.reduce((acc, arr) => acc + arr.byteLength, 0))
  let offset = 0
  arrays.forEach(arr => {
    result.set(arr, offset)
    offset += arr.byteLength
  })
  return result
}

function writeTextFile(path) {
  return textContent =>
    Promise.resolve(path).then($ => fs.writeFileSync($, textContent))
}
