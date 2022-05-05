<h1 align="center">eslint-plugin-<code>big-number-rules</code> 🔢</h1>

<p align="center">
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

✊ Enforce 💰 *finance-safe* 🧷 calculations using [bignumber.js](https://github.com/MikeMcl/bignumber.js/) (or something [similar](#customisation)!) instead of native JavaScript arithmetic and Math functions.

<img alt="Video of plugin-usage in VSCode" src="./screenshot.gif" width="500" />

[ [Customisable!](#customisation) | [ Noisy! ](#limiting-the-number-of-warnings) | [Finance-safe?](#but-why) ]

```sh
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
  },
  "settings": {
    "big-number-rules": {
      // Specify the following if you want rules to
      // apply only to files with this declaration:
      //
      //   import ... from 'bignumber.js'
      //
      "importDeclaration": "bignumber.js",

      // Optionally, you can also apply rules only when
      // importing the desired specifier from such
      // declarations:
      //
      //   import BigNumber from 'bignumber.js'
      //
      "importSpecifier": "BigNumber"
    }
  }
}
```

You can also [customise](#customisation) the transformations.

# Example transforms:

```js
// Regular arithmetic operators:
//
0.1 + 0.2       -->   BigNumber.sum(0.1, 0.2)
19.99 * 0.1     -->   BigNumber(19.99).multipliedBy(0.1)
1 < 2           -->   BigNumber(1).isLessThan(2)

// Can keep a chain going...
//
BigNumber.sum(0.1, 0.2) - 0.3
--> BigNumber.sum(0.1, 0.2).minus(0.3)

3 ** BigNumber(1).plus(2)
--> BigNumber(3).exponentiatedBy(BigNumber(1).plus(2))

// Bit-shifting...
//
2 >>> 4    -->   BigNumber(2).shiftedBy(4)
4 << 2     -->   BigNumber(4).shiftedBy(-2)

// Math methods...
//
Math.min(1, 2)    --> BigNumber.minimum(1, 2)
Math.sign(-6)     --> BigNumber(-6).comparedTo(0)

// toFixed + parseFloat...
//
;(1).toFixed(2)             --> BigNumber(1).decimalPlaces(2)
parseFloat('1.2')           --> BigNumber('1.2')
Number.parseFloat('2.1')    --> BigNumber('2.1')
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
})
```

Look for the `supportsRound` setting in the example configs.

# Limiting the number of warnings

Since 1.6.0 the plugin supports an `importDeclaration` option. If specified, rules will only apply to files that include an import statement that matches it:

For example:

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "settings": {
    "big-number-rules": {
      "importDeclaration": "bignumber.js"
    }
  }
}
```

Now, rules will only be applied to files that have the following import:

```js
import BigNumber from 'bignumber.js'
```

For now this is ESM only, so it won't work with `require()` I'm afraid.

By default, `importDeclaration` is set to `"__IGNORE__"`, meaning all files that eslint is interested in will be processed.

Leaving this default in place on a large project will likely result in looooads of warnings. It's not like we use `===` just for arithmetic, right? :)

There are a few strategies we can employ to keep the number of warnings down to something useful:

1. Read all of the warnings and address the ones that need addressing

2. Add line-by-line and file-by-file ignore comments

3. Centralise your calculations into a few files only

Taken in-order I think these constitute a good approach to ending up with a finance-safe codebase: Identify what needs fixing, fix them, and refactor the calculations as you go into more centralised places.

You can then use a combination of `importDeclaration` and eslint's rule-enabling comment syntax to do things file-by-file, for example:

```js
// sum.js
import BigNumber from 'bignumber.js'

const sum = 1 + 2
//          ^^^^^ - Is this a financial calculation?
//                  (big-number-rules/arithmetic)

...
```

```json
// .eslintrc
{
  "plugins": ["big-number-rules"],
  "settings": {
    "big-number-rules": {
      "importDeclaration": "bignumber.js"
    }
  }
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
BigNumber.sum(1, 2, 3).minus(4)
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
      "importDeclaration": "__IGNORE__",
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
        "!==": ["__NEGATION__", "${L}", "eq", "${R}"],
        "!=": ["__NEGATION__", "${L}", "eq", "${R}"],
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
        "parseFloat": ["__CONSTRUCT__(${A})"],
        "toExponential": "toExponential",
        "toFixed": "dp",
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

`eslint-plugin-big-number-rules` will translate the example above to:

```js
const sum = BigNumber.sum(0.1, 0.2)
BigNumber(sum).isEqualTo(0.3)
// true
```

The problem manifests in the first place because in the floating-point number-type of most languages (not just JavaScript!) the mantissa/significand is represented as a power-of-two fraction rather than a power-of-10 decimal:

```
 _ _._____._____._____._____._____._____._____.______.______.__ _ _
 _ _|  8  |  4  |  2  |  1  | 1/2 | 1/4 | 1/8 | 1/16 | 1/32 | ... etc
    \__________.___________/ \______________________________ _ _ _
Exponent ------^                      |
                                      |
Significand ------>-------->----------^
```

IEEE-754 defines various rules for marshalling these fractions into a decimal, but as you can probably imagine it's not always exact.

Libraries like `bignumber.js` helps us work around this. Using them isn't complicated, but it does require a little discipline and vigilance to keep on top of, so an [eslint](https://eslint.org/) plugin to warn-about the use of JavaScript's native-math methods seemed like a good way to do that.

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

# License

MIT licensed: See [LICENSE](LICENSE)
