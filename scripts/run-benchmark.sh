#!/bin/bash

set -e

trap "rm -rf ./benchmark/compiled" EXIT

yarn tsc --project benchmark
node ./benchmark/compiled/benchmark/index.js