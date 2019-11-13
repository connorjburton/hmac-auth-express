# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [4.0.1] - 2019-11-13
### Changed
- Updated changelog to include correct date for 4.0.0

## [4.0.0] - 2019-11-13
### Added
- Tests, 100% coverage
- `.vscode/launch.json` that includes test configuration for easily debugging tests

### Changed
- **Breaking** The UNIX timestamp's used is now expected to be 13 characters long, not 10 (i.e already divided by `1000`). See [Migration Guide](https://github.com/connorjburton/hmac-auth-express/blob/master/MIGRATION_GUIDE.md#migrating-from-3xx-to-400)
- Improved validation for checking if the HMAC digest exists in the header
- Improved validation for checking if `request.body` is set

## [3.0.0] - 2019-01-02
### Changed
- **Breaking** Changed error handling to pass the error to express' error handler instead of sending a response internally. See [Migration Guide](https://github.com/connorjburton/hmac-auth-express/blob/master/MIGRATION_GUIDE.md#migrating-from-2xx-to-300)

## [2.0.3] - 2018-12-12
### Changed
- Uses `req.originalUrl` instead of `req.baseUrl`

## [2.0.2] - 2018-12-12
### Changed
- Updated changelog

## [2.0.1] - 2018-12-12
### Changed
- Changed readme to include details about timing safe

## [2.0.0] - 2018-12-12
### Security
- **Breaking** Added the supplied unix timestamp to the HMAC signature to ensure the timestamp provided is the timestamp in the HMAC digest

## [1.0.2] - 2018-12-12
### Changed
- Moved validation to it's own `validateArguments.js` file
- Added validaton for `options.maxInterval` and `options.error`
- Added comments to `index.js`