#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
mkdir -p build
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Ifirmware/include tools/test-audio-range.cpp -o build/test-audio-range
./build/test-audio-range
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Icore/PocketQuestCore/src core/PocketQuestCore/src/Game.cpp \
  core/PocketQuestCore/src/Save.cpp core/PocketQuestCore/src/Motion.cpp \
  tests/core_tests.cpp -o build/core_tests
./build/core_tests
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Icore/PocketQuestCore/src tools/test-slime-animation.cpp core/PocketQuestCore/src/Game.cpp \
  -o build/test-slime-animation
./build/test-slime-animation
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Icore/PocketQuestCore/src tools/test-intent-parity.cpp core/PocketQuestCore/src/Game.cpp \
  -o build/test-intent-parity
node tools/test-intent-parity.mjs build/test-intent-parity
clang++ -std=c++17 -Wall -Wextra -Werror -pedantic -g -fsanitize=address,undefined \
  -Icore/PocketQuestCore/src tools/test-journey-parity.cpp core/PocketQuestCore/src/Game.cpp \
  -o build/test-journey-parity
node tools/test-journey-parity.mjs build/test-journey-parity
