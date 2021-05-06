# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.5.0] - 2021-05-06
### Added
- Rules for assignment-expressions (+=, -=, etc.)
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
