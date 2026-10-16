"""Branding and legacy connection compatibility source checks; no device I/O."""
from pathlib import Path

root = Path(__file__).resolve().parent.parent
route = (root / 'web/route/index.html').read_text()
hero = (root / 'webui/index.html').read_text()
display = (root / 'firmware/src/Display.cpp').read_text()
credentials = (root / 'firmware/include/DeviceCredentials.h').read_text()
portal = (root / 'firmware/include/QuestPortal.h').read_text()
delivery = (root / 'tools/prepare-delivery.py').read_text()
assert '<h1>PocketQuestMini</h1>' in route
assert '<title>PocketQuestMini' in route and '<title>PocketQuestMini' in hero
assert 'class="brand">PocketQuestMini<' in hero
assert 'd.print("PocketQuestMini")' in display
assert 6 + len('PocketQuest') * 6 * 2 == 138
assert 138 + len('Mini') * 6 <= 174
assert 'd.setCursor(138,12); d.print("Mini")' in display
assert '"PocketQuest-%04X"' in credentials and '"Quest%08X"' in credentials
assert 'return "http://PocketQuest";' in portal
assert 'PocketQuestMini-S3-v{args.version}' in delivery
assert (root / 'firmware/artwork-sources/PocketQuest-Splash-Owner.png').exists()
print('PASS: Mini branding, 240px header/battery bounds, unchanged legacy Wi-Fi/URL, future delivery name; splash source retained')
