/**
 * Cold-load benchmarks for this plugin (replaces abandoned `load-perf`).
 *
 * Why not load-perf?
 * - Unmaintained (eslint@1-era deps: chalk@1, optionator@0.6)
 * - We only used checkDependencies:false / checkDevDependencies:false —
 *   i.e. a single median of package main load time
 * - For an ESLint plugin, rule module cost and runtime deps matter more
 *
 * What we measure (each sample = fresh Node child process):
 * 1. Plugin entry (package.json "main")
 * 2. Production dependencies
 * 3. Each rule module under lib/rules/*.js
 *
 * Usage: pnpm perf
 * Env:   PERF_RUNS=9  (default 5)  — odd counts give a clean median
 */

const { spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pkg = require(path.join(root, 'package.json'))
const RUNS = Math.max(1, parseInt(process.env.PERF_RUNS || '5', 10) || 5)

/** Cold require of `modulePath` in a disposable Node process; returns ms or null. */
function coldRequireMs(modulePath) {
  // Inline script keeps the child self-contained (no shared caches across samples).
  const script = `
    const { performance } = require('perf_hooks');
    const t0 = performance.now();
    try {
      require(${JSON.stringify(modulePath)});
      process.stdout.write(String(performance.now() - t0));
    } catch (e) {
      process.stderr.write(e && e.stack ? e.stack : String(e));
      process.exit(1);
    }
  `
  const result = spawnSync(process.execPath, ['-e', script], {
    cwd: root,
    encoding: 'utf8',
    env: process.env
  })
  if (result.status !== 0) {
    return { ok: false, error: (result.stderr || result.stdout || 'failed').trim() }
  }
  const value = parseFloat(result.stdout)
  if (Number.isNaN(value)) {
    return { ok: false, error: `non-numeric output: ${result.stdout}` }
  }
  return { ok: true, ms: value }
}

function sample(label, modulePath, runs) {
  const times = []
  for (let i = 0; i < runs; i++) {
    const r = coldRequireMs(modulePath)
    if (!r.ok) {
      return { label, modulePath, error: r.error, times: [] }
    }
    times.push(r.ms)
  }
  times.sort((a, b) => a - b)
  const median = times[Math.floor(times.length / 2)]
  return {
    label,
    modulePath,
    times,
    min: times[0],
    median,
    max: times[times.length - 1]
  }
}

function fmt(n) {
  return `${n.toFixed(3)}ms`
}

function printSample(s) {
  if (s.error) {
    console.log(`  ${s.label}: ERROR — ${s.error}`)
    return
  }
  console.log(
    `  ${s.label}: median ${fmt(s.median)}  (min ${fmt(s.min)}, max ${fmt(s.max)}, n=${s.times.length})`
  )
}

function listRuleModules() {
  const rulesDir = path.join(root, 'lib', 'rules')
  return fs
    .readdirSync(rulesDir)
    .filter(name => name.endsWith('.js'))
    .map(name => ({
      label: `rule:${name.replace(/\.js$/, '')}`,
      modulePath: path.join(rulesDir, name)
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function main() {
  console.log('')
  console.log(`Cold-load benchmarks (${RUNS} runs each, fresh Node process per sample)`)
  console.log(`Node ${process.version}  cwd ${root}`)
  console.log('')

  const targets = []

  // 1) Plugin entry
  if (pkg.main) {
    targets.push({
      label: `main (${pkg.main})`,
      modulePath: path.resolve(root, pkg.main)
    })
  }

  // 2) Production dependencies
  for (const name of Object.keys(pkg.dependencies || {}).sort()) {
    targets.push({
      label: `dep:${name}`,
      modulePath: require.resolve(name, { paths: [root] })
    })
  }

  // 3) Rule modules (direct requires — not via index)
  targets.push(...listRuleModules())

  console.log('Results:')
  const results = targets.map(t => sample(t.label, t.modulePath, RUNS))
  results.forEach(printSample)

  const mainResult = results.find(r => r.label.startsWith('main '))
  if (mainResult && !mainResult.error) {
    console.log('')
    console.log(`  Plugin entry median: ${fmt(mainResult.median)}`)
  }

  const failed = results.filter(r => r.error)
  console.log('')
  if (failed.length) {
    console.log(`Failed: ${failed.length}`)
    process.exitCode = 1
  }
}

main()
