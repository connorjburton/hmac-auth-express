# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [8.0.0](https://github.com/connorjburton/hmac-auth-express/compare/v7.0.0...v8.0.0) (2021-07-11)


### ⚠ BREAKING CHANGES

* changed default header to authorization

### Bug Fixes

* adding pre scripts for all cmds that need typescript & fixing benchmark tool ([16f8837](https://github.com/connorjburton/hmac-auth-express/commit/16f8837568bd0205b3d7769200d9367ded95f0d8))
* all tests are now typescript ([9468c0e](https://github.com/connorjburton/hmac-auth-express/commit/9468c0eacf84d168764b84bdf43940cefc737b2a))
* changed default header to authorization ([46e1f62](https://github.com/connorjburton/hmac-auth-express/commit/46e1f62d216323bcd9e7fb7248ffeda4304262b7))
* first pass at refactoring to typescript ([3469aaf](https://github.com/connorjburton/hmac-auth-express/commit/3469aaf49b653d359adfbd05b844a01d56d7da84))
* fixing tests from ts refactor ([2905531](https://github.com/connorjburton/hmac-auth-express/commit/2905531a7033f085fc6fce06050c92dc6db185b6))
* grammar fixes to readme ([f5d4f37](https://github.com/connorjburton/hmac-auth-express/commit/f5d4f37604375a13c3cecc5f4698a90d6ee4ec41))
* now correctly generates js module with named exports ([0b1a887](https://github.com/connorjburton/hmac-auth-express/commit/0b1a887fb7e8c23821ab713b40453728ec67f72c))
* now supports empty objects and arrays as request bodies ([640bcbe](https://github.com/connorjburton/hmac-auth-express/commit/640bcbe323897b1100961c226078385f83a3121e))
* removing ts-jest, try/catch in test and added correct return type to stringToBuffer ([a356d09](https://github.com/connorjburton/hmac-auth-express/commit/a356d098b23c33a4e3dc518f0e53c0f35d4fb7a7))
* unit tests now use real express request object to mock requests ([44a5beb](https://github.com/connorjburton/hmac-auth-express/commit/44a5beb411bf9cc0e5c256abe1cb85b9515deeca))
* updating readme and migration guide ([de220b0](https://github.com/connorjburton/hmac-auth-express/commit/de220b082ff159877281bd05cd221cf0c605511c))

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