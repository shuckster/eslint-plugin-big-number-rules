# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.0] - 2023-04-09

### Added

- New configuration option: `unsafelyIgnoreSuggestionsForOperators`

```json
{
  "plugins": ["big-number-rules"],
  "settings": {
    "big-number-rules": {
      "unsafelyIgnoreSuggestionsForOperators": ["+", "+="]
    }
  }
}
```

## [2.0.0] - 2023-04-08

### Updated

BREAKING CHANGES:

- Offer `String#concat()` and `Template String` replacements for `+` related rules, in addition to the default BigNumber suggestion.

- Offer `Object.is()` replacement for `===` related rules, in addition to the default BigNumber suggestion.

Since these are now multiple suggestions instead of just one fix, these rules no longer auto-fix, hence the major version bump.

## [1.10.2] - 2023-02-02

### Fixed

- `decimalPlaces` specifies a maximum number of DPs, not a fixed number, so is not a valid substitute for `toFixed`.
- Update README to reflect this fix.

## [1.10.0] - 2023-02-02

### Updated

- bitwise + comparison rules are now separate from arithmetic rules:

  ```json
  // .eslintrc
  {
    "plugins": ["big-number-rules"],
    "rules": {
      "big-number-rules/arithmetic": "warn",
      "big-number-rules/bitwise": "warn",
      "big-number-rules/comparison": "warn"
    }
  }
  ```

  These rules are also part of `big-number-rules/recommended`:

  ```json
  // .eslintrc
  {
    "plugins": ["big-number-rules"],
    "extends": ["plugin:big-number-rules/recommended"]
  }
  ```

## [1.9.1] - 2022-06-01

### Fixed

- Updated match-iz, fix recusion

## [1.9.0] - 2022-05-31

### Updated

- Remove build process to permit better debugging opportunities.

## [1.8.5] - 2022-05-05

### Fixed

- Target `imported` rather than `local` specifier

## [1.8.4] - 2022-05-05

### Updated

- Small refactor using `sift-r`

## [1.8.3] - 2022-05-05

### Updated

- New option for ESM files: `importSpecifier`. Works in conjunction with `importDeclaration` option to further guard against running rules unless the specified import is met.

  For example:

  ```json
  // .eslintrc
  {
    "settings": {
      "big-number-rules": {
        "importDeclaration": "my-lib.js",
        "importSpecifier": "NumberProcessor"
      }
    }
  }
  ```

  With this config, rules will only be applied to files with the following import:

  ```js
  import NumberProcessor from 'my-lib.js'
  import { NumberProcessor } from 'my-lib.js'
  import { BigNumber as NumberProcessor } from 'my-lib.js'
  ```

  The rules will not apply if `my-lib.js` is imported without `NumberProcessor`.

## [1.7.8] - 2022-04-10

### Updated

- Dependencies
- Update deprecated match-iz pattern

## [1.7.7] - 2022-01-24

### Fixed

- https://github.com/shuckster/eslint-plugin-big-number-rules/issues/2

## [1.7.6] - 2022-01-10

### Update

- Update deps, rebuild

## [1.7.5] - 2021-12-02

### Update

- Minor refactoring

## [1.7.4] - 2021-09-19

### Update

- Refactor some rules to use pattern-matching

## [1.7.3] - 2021-09-16

### Update

- Improve README floating-point explanation

## [1.7.2] - 2021-09-03

### Fixed

- `isNaN` transformations were incorrect

## [1.7.1] - 2021-09-01

### Updated

- Update README with negation examples

## [1.7.0] - 2021-09-01

### Added

- Support for transforming `!==` and `!=`

## [1.6.2] - 2021-09-01

### Updated

- Include `importDeclaration` at top of README to help the quick-starters

## [1.6.1] - 2021-08-31

### Fixed

- `importDeclaration` rule was only applying to the first import

## [1.6.0] - 2021-08-31

### Updated

- New option for ESM files: `importDeclaration`. Defaults to "**IGNORE**",
  but if specified the plugin will only apply its rules to files that
  include an import statement matching it.

  For example, if `importDeclaration` is `"my-lib.js"`, the plugin will only
  apply rules to a file if it sees the following import:

      import whatever from 'my-lib.js'

### Fixed

- Correct date on 1.5.6 changelog entry

## [1.5.6] - 2021-08-31

### Updated

- Improve `isNaN` rule to only operate on global/Number namespace

## [1.5.5] - 2021-08-20

### Updated

- Avoid warnings on expressions that use `.length` -- very unlikely to
  be financial calculations

## [1.5.4] - 2021-08-19

### Updated

- Avoid warnings on stuff that's obviously string concatenation

## [1.5.3] - 2021-08-18

### Updated

- Update README with info on applying per-file rules

## [1.5.2] - 2021-05-07

### Added

- Support bitwise double-not (`~~`) used for floor'ing

## [1.5.1] - 2021-05-06

### Changed

- Assignment replacements should include an assignment :P

## [1.5.0] - 2021-05-06

### Added

- Rules for assignment-expressions (`+=`, `-=`, etc.)
  (big-number-rules/assignment)

## [1.4.0] - 2021-05-05

### Changed

- Move comparison-operators into their own sub-config. No rule-changes

## [1.3.4] - 2021-04-26

### Updated

- README updates + corrections, dep-updates

## [1.3.0] - 2021-04-25

### Changed

- Bundle to target node>=10 instead of 14

## [1.2.2] - 2021-04-25

### Fixed

- Missing README link to example .eslintrc for big.js

## [1.2.0] - 2021-04-25

### Updated

- Bitwise settings are now their own thing

## [1.1.0] - 2021-04-25

### Added

- Added some example settings files for different libraries.

### Updated

- Optionally prefer `plus` for libraries that don't support `sum` with `supportsSum` setting.

- Can now offer replacements for `Math.round|ceil|floor` for libraries that support it.

- Refactored test-suite so it will test the example settings files.

## [1.0.6] - 2021-04-24

### Fixed

- Settings overrides were referencing old namespace

## [1.0.5] - 2021-04-24

### Changed

- Update README config link

## [1.0.4] - 2021-04-24

### Added

- `toExponential`, `toPrecision`, `toString`

### Updated

- Instead of a function, you can now use a JSON-friendly array to configure the more detailed overriding of binary-expressions in `.eslintrc`. See the `<<` operator for reference.

## [1.0.3] - 2021-04-24

### Added

- Recommended rules setting: `big-number-rules/recommended`

## [1.0.2] - 2021-04-24

### Changed

- Post-publishing README tweaks

## [1.0.0] - 2021-04-24

### Added

- eslint-plugin-big-number-rules :)
