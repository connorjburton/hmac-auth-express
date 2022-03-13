# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [8.3.2](https://github.com/connorjburton/hmac-auth-express/compare/v8.3.1...v8.3.2) (2022-03-13)

### Bug Fixes

* reduce published package size from 334kb to 36kb ([e7d5801](https://github.com/connorjburton/hmac-auth-express/commit/e7d5801c4ad76c79f27461587c5122dd87f4bf2e))

## [8.3.1](https://github.com/connorjburton/hmac-auth-express/compare/v8.3.0...v8.3.1) (2022-03-13)

### Bug Fixes

* remove a === b in order func as not a possible state ([5bca1e4](https://github.com/connorjburton/hmac-auth-express/commit/5bca1e4e78ef09407a090224ef5d434c706a12a8))

### [8.3.0](https://github.com/connorjburton/hmac-auth-express/compare/v8.2.0...v8.3.0) (2022-03-07)

### Features

* add option to order body ([c7558d1](https://github.com/connorjburton/hmac-auth-express/commit/c7558d1d7c8d74f19b8e33128073d293a48ee94c))


## [8.2.0](https://github.com/connorjburton/hmac-auth-express/compare/v8.1.0...v8.2.0) (2021-08-23)


### Features

* allow secret parameter to be a function to support dynamic secrets ([e612eff](https://github.com/connorjburton/hmac-auth-express/commit/e612effcf7adea2541d33593880033e14f9be0a9))

## [8.1.0](https://github.com/connorjburton/hmac-auth-express/compare/v8.0.2...v8.1.0) (2021-07-18)


### Features

* exposing generate function to easily generate hmac digests ([7996b40](https://github.com/connorjburton/hmac-auth-express/commit/7996b40d1ba958d63546e3d619ebba65a0a8d837))


### Bug Fixes

* updating benchmark tool to use new default header ([7836d75](https://github.com/connorjburton/hmac-auth-express/commit/7836d7547f1c09e02488feb2c1be652cef42ef07))

## [8.0.1-8.0.2](https://github.com/connorjburton/hmac-auth-express/compare/v8.0.0...v8.0.2) (2021-07-11)

### Bug Fixes

* published version did not include all compiled files correctly

## [8.0.0](https://github.com/connorjburton/hmac-auth-express/compare/v7.0.0...v8.0.0) (2021-07-11)


### [⚠ BREAKING CHANGES](https://github.com/connorjburton/hmac-auth-express/blob/master/MIGRATION_GUIDE.md)

* changed default header to authorization
* package now exclusively uses named exports
* error is now exported as `AuthError` rather than `HMACAuthError`
* importing `AuthError` is now done directly on `hmac-auth-express` rather than `hmac-auth-express/src/errors`

### Bug Fixes

* now supports empty objects and arrays as request bodies ([640bcbe](https://github.com/connorjburton/hmac-auth-express/commit/640bcbe323897b1100961c226078385f83a3121e))

## [7.0.0](https://github.com/connorjburton/hmac-auth-express/compare/v6.0.1...v7.0.0) (2021-07-04)


### ⚠ BREAKING CHANGES

* addition of express peer dependency may fail installations of users using express <4

### Bug Fixes

* changes to package.json & e2e test ([4b17f33](https://github.com/connorjburton/hmac-auth-express/commit/4b17f33d4107a47453237781eeccb845347159d0))

## 6.0.1 - 2021-06-28
### Added
- Added Github Actions
### Removed
- Removed Travis integration
### Security
- Bumped `jest` from `26.3.0` to `27.0.6`

## 6.0.0 - 2020-08-12
### Changed
- **Breaking** Inversed `timeDiff` value in comparison against `minInterval` option so option parameters are consistent.

## 5.0.1 - 2020-08-12
### Changed
- Updated `parseInt` call to pass `radix` parameter of `10`
### Security
- Bumped `jest` from `26.2.2` to `26.3.0`

## 5.0.0 - 2020-08-01
### Added
- **Breaking** Support for plain arrays in the request body. Previously a plain array request body would be rejected, this change could potentially allow unexpected behaviour, thus the breaking change.
### Security
- Bumped `jest` from `24.9.0` to `26.2.2`

## 4.1.0 - 2020-03-20
### Added
- `options.minInterval` for out of sync times (requests from the future)
### Security
- Bumped `acorn` from `5.7.3` to `5.7.4`

## 4.0.2 - 2019-12-31
### Added
- Added Travis CI for running tests on pull requests
- Added automatic NPM publish on master push
### Changed
- Added Travis CI badge to readme

## 4.0.1 - 2019-11-13
### Changed
- Updated changelog to include correct date for 4.0.0

## 4.0.0 - 2019-11-13
### Added
- Tests, 100% coverage
- `.vscode/launch.json` that includes test configuration for easily debugging tests

### Changed
- **Breaking** The UNIX timestamp's used is now expected to be 13 characters long, not 10 (i.e already divided by `1000`). See [Migration Guide](https://github.com/connorjburton/hmac-auth-express/blob/master/MIGRATION_GUIDE.md#migrating-from-3xx-to-400)
- Improved validation for checking if the HMAC digest exists in the header
- Improved validation for checking if `request.body` is set

## 3.0.0 - 2019-01-02
### Changed
- **Breaking** Changed error handling to pass the error to express' error handler instead of sending a response internally. See [Migration Guide](https://github.com/connorjburton/hmac-auth-express/blob/master/MIGRATION_GUIDE.md#migrating-from-2xx-to-300)

## 2.0.3 - 2018-12-12
### Changed
- Uses `req.originalUrl` instead of `req.baseUrl`

## 2.0.2 - 2018-12-12
### Changed
- Updated changelog

## 2.0.1 - 2018-12-12
### Changed
- Changed readme to include details about timing safe

## 2.0.0 - 2018-12-12
### Security
- **Breaking** Added the supplied unix timestamp to the HMAC signature to ensure the timestamp provided is the timestamp in the HMAC digest

## 1.0.2 - 2018-12-12
### Changed
- Moved validation to it's own `validateArguments.js` file
- Added validaton for `options.maxInterval` and `options.error`
- Added comments to `index.js`
