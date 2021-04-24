const loadPerf = require('load-perf')

const echo = (...args) => console.log(...args)

function loadPerformance() {
  echo('')
  echo('Loading:')

  const results = []

  for (let cnt = 0; cnt < 5; cnt++) {
    const loadPerfData = loadPerf({
      package: './package.json',
      checkDevDependencies: false,
      checkDependencies: false
    })

    echo(`  Load performance Run #${cnt + 1}:  %dms`, loadPerfData.loadTime)
    results.push(loadPerfData.loadTime)
  }

  results.sort((a, b) => a - b)
  const median = results[~~(results.length / 2)]

  echo('')
  echo('  Load Performance median:  %dms', median)
  echo('')
}

loadPerformance()
