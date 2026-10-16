# Third-party notices

PocketQuestMini original source and documentation use the repository's MIT License. This does not relicense third-party code incorporated into the firmware. Retain upstream copyright/license notices when redistributing or modifying those components.

Pinned build dependencies:

- M5Unified0.2.25, MIT, copyright M5Stack. Source: https://github.com/m5stack/M5Unified/tree/0.2.25 . License copy: licenses/M5Unified-MIT.txt.
- M5GFX0.2.32, MIT, copyright M5Stack and upstream contributors. Source: https://github.com/m5stack/M5GFX/tree/0.2.32 . License copy: licenses/M5GFX-MIT.txt. Individual files can carry additional upstream notices; retain them.
- Arduino-ESP323.3.9, LGPL-2.1-or-later framework with individually licensed components, including Apache-2.0 LittleFS wrappers and permissive libraries. Exact upstream source: https://github.com/espressif/arduino-esp32/tree/3.3.9 . Framework license: licenses/Arduino-ESP32-LICENSE.md. It is built without local framework modifications; application source and pinned rebuild instructions are supplied to permit rebuilding/relinking against modified framework sources.
- ESP-IDF and target libraries supplied by pinned pioarduino55.03.39 retain Espressif/individual component licenses (Apache-2.0, BSD/permissive and separately licensed binary components). Source/build package mapping: https://github.com/pioarduino/platform-espressif32/tree/55.03.39 and its platform.json; upstream source: https://github.com/espressif/esp-idf . Apache2.0 text supplied in licenses/ESP-IDF-Apache-2.0.txt. This text does not replace individual component notices. SDK binaries remain subject to their own upstream licenses.
- littlefs is copyright2017 Arm Limited and contributors under BSD-3-Clause. Source and license: https://github.com/littlefs-project/littlefs . littlefs-python0.19.0 is a host packaging dependency, not linked into the firmware.
- QR encoding and libb64 retain notices in their respective upstream source files inside M5GFX/Arduino-ESP32. Build tools, Pillow and OxiPNG are not included in runtime firmware.

Prepared illustrations, sprite layers and The Gentle Glade recording were provided/approved by the project owner, with AI-assisted art/music used during development. Reference-game imagery and sheet music discussed during design are not included as runtime assets or copied into the soundtrack. The selected recording is distributed unchanged. This project is not affiliated with Nintendo, Sony, M5Stack or Espressif.

Release source contains the application, prepared runtime inputs and build/configuration scripts. Upstream dependency source remains available at the pinned links above and is downloaded by PlatformIO. When changing dependency versions, review and preserve their notices rather than assuming the application's MIT license applies to them.
