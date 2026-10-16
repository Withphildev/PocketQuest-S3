export function nearbyChest(game,player){
 const c=game.chest?.();return !game.battle&&!game.result&&c&&!c.opened&&Math.hypot(c.u-player.u,(c.v-player.v)*9/16)<48?c:null;
}
export function canOpenChest(game,c){return !!c&&!c.opened&&!game.battle&&!game.result&&game.cleared.size>0&&((c.potion&&game.hero.potions<2)||game.hero.hp<game.maxHp());}
// Small code-native pixel icon; no new PNG or production scenery library.
export function drawChest(ctx,c,x,y,zoom){
 ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(zoom,zoom);
 ctx.fillStyle='#06130e77';ctx.fillRect(-18,-2,36,6);ctx.fillStyle='#30251c';ctx.fillRect(-16,-22,32,24);
 ctx.fillStyle='#a05e30';ctx.fillRect(-14,-18,28,18);ctx.fillStyle='#d09b54';ctx.fillRect(-14,-22,28,7);
 ctx.fillStyle='#e5bd69';ctx.fillRect(-10,-22,3,22);ctx.fillRect(7,-22,3,22);ctx.fillRect(-3,-13,6,7);
 if(c.opened){ctx.fillStyle='#171a15';ctx.fillRect(-12,-20,24,9);ctx.fillStyle='#a05e30';ctx.fillRect(-14,-30,28,7);ctx.fillStyle='#e5bd69';ctx.fillRect(-10,-30,3,7);ctx.fillRect(7,-30,3,7);}
 ctx.font='11px system-ui';ctx.textAlign='center';ctx.fillStyle='#fff0b8';ctx.fillText(c.opened?'OPENED':'CHEST',0,-36);ctx.restore();
}
