#include "lgfx_qrcode.h"
#include <assert.h>
#include <stdlib.h>
#include <stdio.h>
int main(void) {
    const char *payload="WIFI:T:WPA;S:PocketQuest-FFFF;P:QuestFFFFFFFF;H:false;;";
    QRCode qr; uint8_t *buffer=malloc(lgfx_qrcode_getBufferSize(4)); assert(buffer);
    assert(lgfx_qrcode_initText(&qr,buffer,4,ECC_LOW,payload)==0);
    assert(qr.size==33);
    // Same quiet-zone calculation as M5GFX: 123px box -> 3px/module, 12px margins.
    assert((123-33*3)/2>=4*3);
    free(buffer); puts("PASS: Wi-Fi payload fits version 4 QR, four-module quiet zone");
}
