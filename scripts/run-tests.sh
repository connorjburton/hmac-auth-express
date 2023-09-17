#!/bin/bash

set -e

trap "rm -rf ./tests/compiled" EXIT

yarn tsc --project tests
node --test $1 ./tests/compiled/tests/**/*.test.js