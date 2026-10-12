#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Icore/PocketQuestCore/src core/PocketQuestCore/src/Game.cpp \
  core/PocketQuestCore/src/Save.cpp core/PocketQuestCore/src/Motion.cpp \
  tests/core_tests.cpp -o build/core_tests
./build/core_tests
