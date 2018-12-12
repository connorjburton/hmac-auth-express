# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2018-12-12
### Security
- **Breaking** Added the supplied unix timestamp to the HMAC signature to ensure the timestamp provided is the timestamp in the HMAC digest

## [1.0.2] - 2018-12-12
### Changed
- Moved validation to it's own `validateArguments.js` file
- Added validaton for `options.maxInterval` and `options.error`
- Added comments to `index.js`