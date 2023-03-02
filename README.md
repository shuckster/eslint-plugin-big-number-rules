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

✊ Enforce 💰 _finance-safe_ 🧷 calculations using [bignumber.js](https://github.com/MikeMcl/bignumber.js/) (or something [similar](#customisation)!) instead of native JavaScript arithmetic and Math functions.

<img alt="Video of plugin-usage in VSCode" src="./screenshot.gif" width="500" />

- [Customisable!](https://github.com/shuckster/eslint-plugin-big-number-rules/wiki/Customisation)
- [Noisy!](https://github.com/shuckster/eslint-plugin-big-number-rules/wiki/Limit-the-number-of-warnings)
- [Finance-safe?](#but-why)

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

You can also [customise](https://github.com/shuckster/eslint-plugin-big-number-rules/wiki/Customisation) the transformations.

# Example transforms:

| from                       | to                                   |
| -------------------------- | ------------------------------------ |
| `0.1 + 0.2`                | `BigNumber.sum(0.1, 0.2)`            |
| `19.99 * 0.1`              | `BigNumber(19.99).multipliedBy(0.1)` |
| `1 < 2`                    | `BigNumber(1).isLessThan(2)`         |
| `2 >>> 4`                  | `BigNumber(2).shiftedBy(4)`          |
| `4 << 2`                   | `BigNumber(4).shiftedBy(-2)`         |
| `Math.min(1, 2)`           | `BigNumber.minimum(1, 2)`            |
| `Math.sign(-6)`            | `BigNumber(-6).comparedTo(0)`        |
| `(1).toFixed(2)`           | `BigNumber(1).decimalPlaces(2)`      |
| `parseFloat('1.2')`        | `BigNumber('1.2')`                   |
| `Number.parseFloat('2.1')` | `BigNumber('2.1')`                   |

Can keep a chain going...

```js
BigNumber.sum(0.1, 0.2) - 0.3
// --> BigNumber.sum(0.1, 0.2).minus(0.3)

3 ** BigNumber(1).plus(2)
// --> BigNumber(3).exponentiatedBy(BigNumber(1).plus(2))
```

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

If you'd like to offer a material contribution, I like [coffee ☕️](https://www.buymeacoffee.com/shuckster) :)

# License

MIT licensed: See [LICENSE](LICENSE)
