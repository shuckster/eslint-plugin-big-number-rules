# eslint-plugin-big-number-rules

### ✊ Enforce 💰 *finance-safe* 🧷 calculations using [bignumber.js](https://github.com/MikeMcl/bignumber.js/) (or something [similar](#customisation)!) instead of native JavaScript arithmetic and Math functions:

<img alt="Video of plugin-usage in VSCode" src="./screenshot.gif" width="500" />

<p>
  <a href="https://github.com/shuckster/eslint-plugin-big-number-rules/blob/master/LICENSE">
    <img
      alt="MIT license"
      src="https://img.shields.io/npm/l/eslint-plugin-big-number-rules?style=plastic"
    /></a>
  <a href="https://www.npmjs.com/package/eslint-plugin-big-number-rules">
    <img
      alt="Version"
      src="https://img.shields.io/npm/v/eslint-plugin-big-number-rules?style=plastic"
    /></a>
</p>

[ [Customisable!](#customisation) | [ Noisy! ](#limiting-the-number-of-warnings) | [Finance-safe?](#but-why) ]

```sh
# Installation:
$ pnpm i eslint-plugin-big-number-rules --save-dev
```

## Configuration

After installation, make the plugin available to your `eslint`:

```json
// .eslintrc
{
  "plugins": ["big-number-rules"]
}
```

Recommended rules will `warn` about everything:

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "extends": ["plugin:big-number-rules/recommended"]
}
```

"Everything" means this:

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "rules": {
    "big-number-rules/arithmetic": "warn",
    "big-number-rules/assignment": "warn",
    "big-number-rules/isNaN": "warn",
    "big-number-rules/math": "warn",
    "big-number-rules/number": "warn",
    "big-number-rules/parseFloat": "warn",
    "big-number-rules/rounding": "warn"
  }
}
```

You can also [customise](#customisation) the transformations.

# Example transforms:

```js
// Regular arithmetic operators:
//
// 0.1 + 0.2
// 19.99 * 0.1
// 1 < 2
//
// ...becomes:
BigNumber.sum(0.1, 0.2)
BigNumber(19.99).multipliedBy(0.1)
BigNumber(1).isLessThan(2)

// Can keep a chain going...
//
// BigNumber.sum(0.1, 0.2) - 0.3
// 3 ** BigNumber(1).plus(2)
//
// ...becomes:
BigNumber.sum(0.1, 0.2).minus(0.3)
BigNumber(3).exponentiatedBy(BigNumber(1).plus(2))

// Bit-shifting...
///
// 2 >>> 4
// 4 << 2
//
// ...becomes:
BigNumber(2).shiftedBy(4)
BigNumber(4).shiftedBy(-2)

// Math methods...
//
// Math.min(1, 2)
// Math.sign(-6)
//
// ...becomes:
BigNumber.minimum(1, 2)
BigNumber(-6).comparedTo(0)

// toFixed + parseFloat...
//
// ;(1).toFixed(2)
// parseFloat('1.2')
// Number.parseFloat('2.1')
//
// ...becomes:
BigNumber(1).decimalPlaces(2)
BigNumber('1.2')
BigNumber('2.1')
```

## What about Math.round(), ceil, floor?

That works, just not for `bignumber.js`.

The [big.js](https://github.com/shuckster/eslint-plugin-big-number-rules/blob/master/eslintrc-for-other-libs/for-bigjs.json) config supports transformations:

```js
// Math.round(1.5)
// Math.ceil(1.5)
// Math.floor(1.5)
//
// ...becomes:
Big.round(1.5, 1) // 1 = half_up (round)
Big.round(1.5, 3) // 3 = up (ceil)
Big.round(1.5, 0) // 0 = down (floor)
```

However, `bignumber.js` configures its rounding-mode by setting an option in its constructor. The plugin can't perform a replacement in this case, so it warns you instead:

```
big-number-rules/rounding
  46:1   warning  is 'Math.round(10)' a financial calculation?
                  If so, use the global constructor setting:

BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP
})}
```

Look for the `supportsRound` setting in the example configs.

# Limiting the number of warnings

When enabling this plugin on a large project you will likely see looooads of warnings. It's not like we use `===` just for arithmetic, right? :)

There are a few strategies we can employ to keep the number of warnings down to something useful:

1. Read all of the warnings and address the ones that need addressing

2. Add line-by-line and file-by-file ignore comments

3. Centralise your calculations into a few files only

Taken in-order I think these constitute a good approach to ending up with a finance-safe codebase: Identify what needs fixing, fix them, and refactor the calculations as you go into more centralised places.

For example, put calculations in `*.calc.js` files and permit `big-number-rules` for just those ones using `overrides`:

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "overrides": [
    {
      "files": ["src/**/*.calc.js"],
      "extends": ["plugin:big-number-rules/recommended"],
      // "rules": { ... }
    }
  ]
}
```

# Any other caveats?

You may need to tweak some of the generated output.

For example, while developing the plugin I got this:

```js
1 + 2 + 3 - 4

// auto-fixes to:
BigNumber(BigNumber.sum(1, 2, 3)).minus(4)
```

This is valid, but the parser now produces the more efficient:

```js
BigNumber.sum(1, 2, 3).minus(1)
```

I'm not much of a hotshot with AST parsing, so you may encounter more weirdness like this. Contributions welcome. :)

# Customisation

Want to use something other than `bignumber.js`? Or use its shorter method-names such as `pow` and `div` instead of `exponentiatedBy` and `dividedBy`?

Here's a config that works with [big.js](http://mikemcl.github.io/big.js/):

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "settings": {
    "big-number-rules": {
      "construct": "Big",
      "supportsSum": false,
      "supportsBitwise": false,
      "supportsRound": true,
      "arithmetic": {
        "+": "plus",
        "-": "minus",
        "/": "div",
        "*": "times",
        "**": "pow",
        "%": "mod"
      },
      "assignment": {
        "+=": "plus",
        "-=": "minus",
        "/=": "div",
        "*=": "times",
        "**=": "pow",
        "%=": "mod"
      },
      "comparison": {
        "<": "lt",
        "<=": "lte",
        "===": "eq",
        "==": "eq",
        ">=": "gte",
        ">": "gt"
      },
      "math": {
        "min": "min",
        "max": "max",
        "random": "NOT_SUPPORTED",
        "abs": "abs",
        "sign": ["__CONSTRUCT__(${A}).cmp(0)"],
        "sqrt": "sqrt"
      },
      "rounding": {
        "round": ["round", "${A}, 1"],
        "ceil": ["round", "${A}, 3"],
        "floor": ["round", "${A}, 0"]
      },
      "number": {
        "toFixed": "dp",
        "parseFloat": ["__CONSTRUCT__(${A})"],
        "toExponential": "toExponential",
        "toPrecision": "toPrecision",
        "toString": "toString"
      }
    }
  }
}
```

Find more examples in the [/eslintrc-for-other-libs](https://github.com/shuckster/eslint-plugin-big-number-rules/tree/master/eslintrc-for-other-libs/) folder.

Please report an [issue](https://github.com/shuckster/eslint-plugin-big-number-rules/issues) if your particular lib does something differently!

There can't be *that* many edge-cases, right? ;-)

# But why?

If you use floating-points for currency (instead of whole-numbers like you probably should) libraries like [bignumber.js](https://github.com/MikeMcl/bignumber.js/) help keep your code away from the binary floating-point [pitfalls](https://medium.com/@magnusjt/how-to-handle-money-in-javascript-b954d612373c) of [IEEE-754](https://stackoverflow.com/questions/3730019/why-not-use-double-or-float-to-represent-currency):

```js
const sum = 0.1 + 0.2
sum === 0.3
// false

sum
// 0.30000000000000004
```

This is the classic example and is often cited, but there are other rare corner-cases that will eventually be caught some time after committing to a currency-unsafe solution.

`eslint-plugin-big-number-rules` will translate the above to:

```js
const sum = BigNumber.sum(0.1, 0.2)
BigNumber(sum).isEqualTo(0.3)
// true
```

Using `bignumber.js` isn't complicated, but it does require a little discipline and vigilance to keep on top of, so an [eslint](https://eslint.org/) plugin to warn-about the use of JavaScript's native-math methods, and also offer to fill-in alternatives, seemed like a good way to do that.

# Credits

`eslint-plugin-big-number-rules` was written by [Conan Theobald](https://github.com/shuckster/).

He was inspired by the work of these fine Internet folk:

- [bignumber.js](https://github.com/MikeMcl/bignumber.js/) :)
- [eslint-plugin-bignumber](https://github.com/fnando/eslint-plugin-bignumber)
- [eslint-plugin-arithmetic](https://github.com/JonnyBurger/eslint-plugin-arithmetic)
- [AST Explorer](https://astexplorer.net/)

🙏

## Contributing

To support my efforts with this project, consider checking out the accountancy company I work for: [Crunch](https://www.crunch.co.uk/).

If you'd rather not change your entire accounting solution for the sake of an eslint plugin, but it nevertheless saved you a little pain, please consider [buying me a coffee](https://www.buymeacoffee.com/shuckster). ☕️

# License

MIT licensed: See [LICENSE](LICENSE)
