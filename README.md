# eslint-plugin-big-number-rules

## ✊ Enforce 💰 *finance-safe* 🧷 calculations using [BigNumber.js](https://github.com/MikeMcl/bignumber.js/) (or something [similar](#eslintrc)!) instead of native JavaScript arithmetic and Math functions:

![screenshot](screenshot.gif)

```sh
# Installation:
$ pnpm i eslint-plugin-big-number-rules --save-dev
```

### *arithmetic*...

```js
// 0.1 + 0.2
// 19.99 * 0.1
// 1 < 2
//
// ...becomes:
BigNumber.sum(0.1, 0.2)
BigNumber(19.99).multipliedBy(0.1)
BigNumber(1).isLessThan(2)
```

### ...*chaining*...

```js
// BigNumber.sum(0.1, 0.2) - 0.3
BigNumber.sum(0.1, 0.2).minus(0.3)

// 3 ** BigNumber(1).plus(2)
BigNumber(3).exponentiatedBy(BigNumber(1).plus(2))
```

### ...*bit-shifting*...

```js
// 2 >>> 4
BigNumber(2).shiftedBy(4)

// 4 << 2
BigNumber(4).shiftedBy(-2)
```

### ...*Math.methods()*...

```js
// Math.min(1, 2)
BigNumber.minimum(1, 2)

// Math.sign(-6)
BigNumber(-6).comparedTo(0)
```

### ...*toFixed + parseFloat*...

```js
// ;(1).toFixed(2)
BigNumber(1).decimalPlaces(2)

// parseFloat('1.2')
BigNumber('1.2')

// Number.parseFloat('2.1')
BigNumber('2.1')
```

## What about Math.round(), ceil, floor?

`BigNumber` sets its rounding-mode using a global setting. The plugin can't perform a replacement in this case, but it will warn you about it:

```
big-number-rules/rounding
  46:1   warning  is 'Math.round(10)' a financial calculation?
                  If so, use the global constructor setting:

BigNumber.set({
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP
})}
```

## Any caveats?

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

# But why?

If you use floating-points for currency (instead of decimals like you should) libraries like [BigNumber](https://github.com/MikeMcl/bignumber.js/) help keep your code away from the binary floating-point pitfalls of [IEEE-754](https://medium.com/@magnusjt/how-to-handle-money-in-javascript-b954d612373c):

```js
const sum = 0.1 + 0.2
sum === 0.3
// false

sum
// 0.30000000000000004
```

This plugin lets you know what you've missed, and will auto-translate the above into:

```js
const sum = BigNumber.sum(0.1, 0.2)
BigNumber(sum).isEqualTo(0.3)
// true

sum.toString() // You'll have to do the toString() yourself!
// "0.3"
```

# .eslintrc

After [installation](#eslint-plugin-big-number-rules), make the plugin available to your `eslint`:

```js
// .eslintrc
{
  "plugins": ["big-number-rules"]
}
```

The full list of rules:

```js
// .eslintrc
{
  "rules": {
    "big-number-rules/arithmetic": "warn",
    "big-number-rules/isNaN": "warn",
    "big-number-rules/math": "warn",
    "big-number-rules/number": "warn",
    "big-number-rules/parseFloat": "warn",
    "big-number-rules/rounding": "warn"
  }
}
```

Want to use something other than `BigNumber`?

```js
// .eslintrc
{
  "settings": {
    "big-number-rules": {
      "construct": "BigNumber",
      "sum": "sum",
      "arithmetic": {
        "+": "plus",
        "-": "minus",
        "/": "dividedBy",
        "*": "multipliedBy",
        "**": "exponentiatedBy",
        "%": "modulo",
        "<": "isLessThan",
        "<=": "isLessThanOrEqualTo",
        "===": "isEqualTo",
        "==": "isEqualTo",
        ">=": "isGreaterThanOrEqualTo",
        ">": "isGreaterThan",
        ">>": "shiftedBy",
        ">>>": "shiftedBy"
      },
      "math": {
        "min": "minimum",
        "max": "maximum",
        "random": "random",
        "abs": "absoluteValue",
        "sign": "comparedTo",
        "sqrt": "squareRoot"
      },
      "rounding": {
        "floor": "ROUND_FLOOR",
        "ceil": "ROUND_CEIL",
        "round": "ROUND_HALF_UP"
      },
      "number": {
        "toFixed": "decimalPlaces",
        "parseFloat": "__CONSTRUCT__"
      }
    }
  }
}
```

## About

`eslint-plugin-big-number-rules` was written by [Conan Theobald](https://github.com/shuckster/).

## Contributing

To support my efforts with this project, consider checking out the accountancy company I work for: [Crunch](https://www.crunch.co.uk/).

If you'd rather not change your entire accounting solution for the sake of an eslint plugin, but it nevertheless saved you a little pain, please consider [buying me a coffee](https://www.buymeacoffee.com/shuckster). ☕️

## Credits

Inspired by the work of these fine Internet folk:

- [eslint-plugin-bignumber](https://github.com/fnando/eslint-plugin-bignumber)
- [eslint-plugin-arithmetic](https://github.com/JonnyBurger/eslint-plugin-arithmetic)
- [AST Explorer](https://astexplorer.net/)

## License

MIT licensed: See [LICENSE](LICENSE)
