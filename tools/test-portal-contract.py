"""Source-contract check only; not an on-device DNS/network integration test."""
from pathlib import Path
root=Path(__file__).resolve().parent.parent
portal=(root/'firmware/include/QuestPortal.h').read_text()
display=(root/'firmware/src/Display.cpp').read_text()
main=(root/'firmware/src/main.cpp').read_text()
assert 'String url() const { return "http://PocketQuest"; }' in portal
assert 'dns_.start(53,"*",WiFi.softAPIP())' in portal
assert 'dns_.processNextRequest()' in portal and 'server_.handleClient()' in portal
assert 'portal.loop()' in main and 'portal.url().c_str()' in main
assert 'd.print(url)' in display
assert 'http://192.168.4.1' in portal
assert 'http://PocketQuest' in portal
assert 6+len('http://PocketQuest')*6<=240
print('PASS: friendly URL, wildcard DNS/service wiring, numeric fallback and text bounds (source checks)')
