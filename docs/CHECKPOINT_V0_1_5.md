# v0.1.5 source checkpoint

Includes firmware through friendly hotspot URL, standalone combat, splash/Nova art, preparation tools/tests, Sunlit validation/artwork pipeline, browser calibration, storage policy, and next-enemy references. Firmware BINs, filesystem images, generated browser builds/review bundles, local logs, caches and discarded illustration attempts remain excluded from Git. No GitHub Release or physical flashing is part of this checkpoint.

## Reproduce artwork and browser calibration from source

From repository root, Python with Pillow 12.3.0 (web/tools/requirements-artwork.txt) and Node:

```sh
python3 web/tools/prepare-artwork.py web/artwork-sources/recipe.json web/build/artwork --candidate
python3 web/tools/validate-sunlit-ground.py web/artwork-sources/sunlit-candidate/master.png web/build/artwork web/assets/F002-east-west.json web/build/validated-ground
python3 web/tools/prepare-nova.py web/artwork-sources/nova/female-generated.png web/artwork-sources/nova/male-generated.png web/build/nova
python3 web/tools/prepare-female-nova-v2.py web/artwork-sources/nova-female-v2/spaced.png web/build/nova web/build/nova-female-v2
python3 web/tools/prepare-nova-sword.py web/artwork-sources/nova-sword/spaced.png web/artwork-sources/nova-sword/recipe.json web/build/nova-sword
node web/tools/build.mjs --ground-validation --nova-v2
node web/tools/build-sword-preview.mjs
node --test web/tests/*.test.mjs
node web/tools/test-prepared-ground.mjs web/build/validated-ground
python3 web/tools/test-artwork.py
python3 web/tools/test-nova.py web/build/nova
python3 web/tools/test-female-nova-v2.py web/build/nova-female-v2
python3 web/tools/test-nova-sword.py web/build/nova-sword
```

Ground candidate corrections are bounded composition, not production-art approval. Existing historical milestone reports describe results at their time; later Nova and firmware reports supersede earlier placeholder/control descriptions.

## Firmware

Generated RGB565 headers required for firmware compilation are included, as well as their source artwork and encoding tools. No credentials for any actual device are stored; SSID/password derive from chip ID at runtime, with the documented predictability/collision limitations.

```sh
python3 tools/prepare-battle-art.py firmware/artwork-sources/PocketQuest-Splash-Owner.png
python3 tools/test-battle-art.py
python3 tools/test-portal-contract.py
sh tools/test-host.sh
pio run -d firmware
python3 tools/check-build.py
```

Additional host tests live in tools/test-screen-flow.cpp, test-battle-animation.cpp, test-device-credentials.cpp, test-battery-ui.cpp and test-wifi-qr.c. The first two link core/PocketQuestCore/src/Game.cpp; QR test links installed M5GFX lgfx_qrcode.c. Delivery uses tools/prepare-delivery.py with the pinned framework boot_app0.bin, version 0.1.5, and a descriptive feature label. Source pushes do not automatically build, publish or flash firmware.
